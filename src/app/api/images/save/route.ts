import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

// Fallback storage function for when database is unavailable
async function saveImageToFileSystem(
  imageData: Buffer,
  mimeType: string,
  filename: string,
  userId: string
): Promise<string> {
  try {
    const uploadsDir = join(process.cwd(), 'public', 'uploads', userId);
    await mkdir(uploadsDir, { recursive: true });
    
    const filePath = join(uploadsDir, filename);
    await writeFile(filePath, imageData);
    
    return `/uploads/${userId}/${filename}`;
  } catch (error) {
    console.error("Failed to save to filesystem:", error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("Starting image save process...");

    // Parse request body
    let requestData;
    try {
      requestData = await request.json();
    } catch (parseError) {
      console.error("Failed to parse request JSON:", parseError);
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.log("Unauthorized request - no session or user ID");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limiting
    if (!checkRateLimit(session.user.id, 20, 60000)) {
      console.log("Rate limit exceeded for user:", session.user.id);
      return NextResponse.json(
        { error: "Too many requests. Please wait before saving more images." },
        { status: 429 }
      );
    }

    const { prompt, imageData, provider, model, width, height, steps } =
      requestData;

    // Validate required fields
    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: "Valid prompt is required" },
        { status: 400 }
      );
    }

    if (!imageData || typeof imageData !== "string") {
      return NextResponse.json(
        { error: "Valid image data is required" },
        { status: 400 }
      );
    }

    if (!provider || typeof provider !== "string") {
      return NextResponse.json(
        { error: "Valid provider is required" },
        { status: 400 }
      );
    }

    // Process image data
    let processedImageData: Buffer;
    let mimeType: string;
    let filename: string;

    try {
      if (imageData.startsWith("data:")) {
        // Handle data URLs (base64 encoded images)
        const [header, base64Data] = imageData.split(",");
        if (!base64Data) {
          throw new Error("Invalid data URL format - missing base64 data");
        }
        const mimeMatch = header.match(/data:([^;]+)/);
        mimeType = mimeMatch ? mimeMatch[1] : "image/png";
        
        // Validate base64 data
        if (!/^[A-Za-z0-9+/]*={0,2}$/.test(base64Data)) {
          throw new Error("Invalid base64 data");
        }
        
        processedImageData = Buffer.from(base64Data, "base64");
      } else {
        // Handle raw base64 data (without data: prefix)
        // Validate base64 data
        if (!/^[A-Za-z0-9+/]*={0,2}$/.test(imageData)) {
          throw new Error("Invalid base64 data");
        }
        
        processedImageData = Buffer.from(imageData, "base64");
        mimeType = "image/png"; // Default to PNG
      }

      // Validate that we actually got data
      if (processedImageData.length === 0) {
        throw new Error("Processed image data is empty");
      }

      // Generate filename
      const extension = mimeType.split("/")[1] || "png";
      filename = `${provider}_${Date.now()}.${extension}`;

      // Validate image size (limit to 10MB)
      if (processedImageData.length > 10 * 1024 * 1024) {
        throw new Error("Image too large (max 10MB)");
      }

      console.log(
        `Processed image: ${processedImageData.length} bytes, ${mimeType}`
      );
    } catch (error) {
      console.error("Failed to process image data:", error);
      return NextResponse.json(
        { 
          error: `Invalid image data format: ${error instanceof Error ? error.message : "Unknown error"}` 
        },
        { status: 400 }
      );
    }

    // Validate and sanitize numeric fields
    const safeWidth =
      width && typeof width === "number"
        ? Math.max(256, Math.min(4096, width))
        : 1024;
    const safeHeight =
      height && typeof height === "number"
        ? Math.max(256, Math.min(4096, height))
        : 1024;
    const safeSteps =
      steps && typeof steps === "number"
        ? Math.max(1, Math.min(100, steps))
        : 20;

    // Database operations with retry logic
    const retryDatabaseOperation = async <T>(
      operation: () => Promise<T>,
      maxRetries = 3
    ): Promise<T> => {
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          return await operation();
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          console.warn(`Database operation attempt ${attempt} failed:`, errorMessage);

          // Check for specific Prisma errors that shouldn't be retried
          if (error && typeof error === "object" && "code" in error) {
            const prismaError = error as { code: string };
            // Don't retry validation errors, unique constraint violations, etc.
            if (["P2002", "P2025", "P2003", "P2004"].includes(prismaError.code)) {
              throw error;
            }
          }

          if (attempt === maxRetries) {
            throw error;
          }

          // Exponential backoff: wait 100ms, 300ms, 900ms
          const delay = 100 * Math.pow(3, attempt - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
      throw new Error("All retry attempts failed");
    };

    try {
      // Check if similar image already exists (by prompt and provider to avoid exact duplicates)
      const existingImage = await retryDatabaseOperation(async () => {
        return await prisma.generatedImage.findFirst({
          where: {
            userId: session.user.id,
            prompt: prompt.trim(),
            provider,
            // Optional: also check by image hash to prevent exact duplicates
            createdAt: {
              gte: new Date(Date.now() - 60000), // Only check images from last minute
            },
          },
        });
      });

      if (existingImage) {
        console.log("Similar image recently saved:", existingImage.id);
        return NextResponse.json(
          {
            success: true,
            image: {
              ...existingImage,
              displayUrl: `/api/images/${existingImage.id}`,
            },
            message: "Similar image recently saved",
          },
          { status: 200 }
        );
      }

      // Save image to database
      const savedImage = await retryDatabaseOperation(async () => {
        console.log("Attempting to save image to database for user:", session.user.id);
        
        return await prisma.generatedImage.create({
          data: {
            userId: session.user.id,
            prompt: prompt.trim(),
            imageData: processedImageData,
            mimeType: mimeType,
            filename: filename,
            provider,
            model: model || null,
            width: safeWidth,
            height: safeHeight,
            steps: safeSteps,
          },
        });
      });

      console.log("Image saved successfully:", savedImage.id);

      // Return success response with display URL
      return NextResponse.json(
        {
          success: true,
          image: {
            ...savedImage,
            displayUrl: `/api/images/${savedImage.id}`,
            // Don't return the actual binary data in the response
            imageData: undefined,
          },
        },
        { status: 201 }
      );
    } catch (dbError) {
      console.error("Database error:", dbError);

      // Handle specific Prisma errors
      if (dbError && typeof dbError === "object" && "code" in dbError) {
        const prismaError = dbError as { code: string; message?: string };

        switch (prismaError.code) {
          case "P5010":
          case "P1001":
          case "P1002":
            // Database connection failed - try filesystem fallback
            console.log("Database unavailable, attempting filesystem fallback...");
            try {
              const fallbackUrl = await saveImageToFileSystem(
                processedImageData,
                mimeType,
                filename,
                session.user.id
              );
              
              // Return fallback response
              return NextResponse.json(
                {
                  success: true,
                  image: {
                    id: `fs_${Date.now()}`,
                    prompt: prompt.trim(),
                    displayUrl: fallbackUrl,
                    provider,
                    model: model || null,
                    width: safeWidth,
                    height: safeHeight,
                    steps: safeSteps,
                    createdAt: new Date(),
                    isFavorite: false,
                    isPublic: false,
                  },
                  message: "Image saved to filesystem (database unavailable)"
                },
                { status: 201 }
              );
            } catch (fsError) {
              console.error("Filesystem fallback also failed:", fsError);
              return NextResponse.json(
                { error: "Database and filesystem storage both failed. Please try again." },
                { status: 503 }
              );
            }
          case "P2002":
            return NextResponse.json(
              { error: "Image already exists" },
              { status: 409 }
            );
          case "P2025":
            return NextResponse.json(
              { error: "User not found" },
              { status: 404 }
            );
          case "P2003":
            return NextResponse.json(
              { error: "Invalid user reference" },
              { status: 400 }
            );
          default:
            console.error("Unhandled Prisma error:", prismaError);
            return NextResponse.json(
              { 
                error: `Database error: ${prismaError.message || "Unknown database error"}` 
              },
              { status: 500 }
            );
        }
      }

      return NextResponse.json(
        { error: "Failed to save image to database" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Save image error:", error);
    return NextResponse.json(
      {
        error: `Internal server error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      },
      { status: 500 }
    );
  }
}
