import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ImageStorage } from "@/lib/storage";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    console.log("Starting image save process...");

    // Parse request body first to catch any JSON parsing errors
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
    console.log(
      "Session check:",
      session ? "authenticated" : "not authenticated",
      session?.user?.id
    );

    if (!session?.user?.id) {
      console.log("Unauthorized request - no session or user ID");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check rate limit to prevent spam
    if (!checkRateLimit(session.user.id, 20, 60000)) {
      // 20 requests per minute
      console.log("Rate limit exceeded for user:", session.user.id);
      return NextResponse.json(
        { error: "Too many requests. Please wait before saving more images." },
        { status: 429 }
      );
    }

    const { prompt, imageUrl, provider, model, width, height, steps } =
      requestData;

    // Validate required fields and data types
    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      console.log("Invalid prompt:", prompt);
      return NextResponse.json(
        { error: "Valid prompt is required" },
        { status: 400 }
      );
    }

    if (
      !imageUrl ||
      typeof imageUrl !== "string" ||
      (!imageUrl.startsWith("http") && !imageUrl.startsWith("data:"))
    ) {
      console.log("Invalid imageUrl:", imageUrl);
      return NextResponse.json(
        { error: "Valid image URL is required (must be HTTP URL or data URL)" },
        { status: 400 }
      );
    }

    if (!provider || typeof provider !== "string") {
      console.log("Invalid provider:", provider);
      return NextResponse.json(
        { error: "Valid provider is required" },
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

    console.log("Request data:", {
      prompt: prompt.substring(0, 50) + "...",
      imageUrl: imageUrl.substring(0, 100) + "...",
      provider,
      model,
      dimensions: `${safeWidth}x${safeHeight}`,
      steps: safeSteps,
    });

    // Store the image permanently
    let storedImageUrl = imageUrl;
    let storedPathname = null;

    // Only attempt storage for HTTP URLs, not data URLs
    if (imageUrl.startsWith("http")) {
      try {
        // Only attempt storage if we have valid configuration
        if (
          (process.env.NODE_ENV === "production" ||
            process.env.BLOB_READ_WRITE_TOKEN) &&
          imageUrl.startsWith("http")
        ) {
          console.log("Attempting to store image permanently...");
          const storageResult = await ImageStorage.storeImage(
            imageUrl,
            session.user.id,
            prompt.trim(),
            provider
          );
          storedImageUrl = storageResult.url;
          storedPathname = storageResult.pathname;
          console.log("Image stored successfully:", storedImageUrl);
        } else if (process.env.NODE_ENV === "development") {
          // Development fallback to local storage
          console.log("Using local storage for development...");
          storedImageUrl = await ImageStorage.storeImageLocal(
            imageUrl,
            session.user.id,
            prompt.trim(),
            provider
          );
          console.log("Image stored locally:", storedImageUrl);
        }
      } catch (storageError) {
        console.warn(
          "Failed to store image permanently, using original URL:",
          storageError instanceof Error ? storageError.message : storageError
        );
        // Continue with original URL if storage fails
        storedImageUrl = imageUrl;
      }
    } else if (imageUrl.startsWith("data:")) {
      console.log("Data URL detected, skipping external storage");
      // For data URLs, we keep them as-is since they're already self-contained
      storedImageUrl = imageUrl;
    }

    // Retry database operations with exponential backoff
    const retryDatabaseOperation = async <T>(
      operation: () => Promise<T>,
      maxRetries = 3
    ): Promise<T> => {
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          return await operation();
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          console.warn(
            `Database operation attempt ${attempt} failed:`,
            errorMessage
          );

          // Check for specific Prisma errors that shouldn't be retried
          if (error && typeof error === "object" && "code" in error) {
            const prismaError = error as { code: string };
            // Don't retry validation errors, unique constraint violations, etc.
            if (
              ["P2002", "P2025", "P2003", "P2004"].includes(prismaError.code)
            ) {
              throw error;
            }
          }

          if (attempt === maxRetries) {
            throw error;
          }

          // Exponential backoff: wait 100ms, 300ms, 900ms
          const delay = 100 * Math.pow(3, attempt - 1);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
      throw new Error("All retry attempts failed");
    };

    // Check if image already exists to prevent duplicates
    const existingImage = await retryDatabaseOperation(async () => {
      return await prisma.generatedImage.findFirst({
        where: {
          userId: session.user.id,
          prompt: prompt.trim(),
          imageUrl: storedImageUrl,
          provider,
        },
      });
    });

    if (existingImage) {
      console.log("Image already exists:", existingImage.id);
      return NextResponse.json(
        { success: true, image: existingImage, message: "Image already saved" },
        { status: 200 }
      );
    }

    const savedImage = await retryDatabaseOperation(async () => {
      console.log(
        "Attempting to save image to database for user:",
        session.user.id
      );

      // Use a transaction to ensure data consistency
      return await prisma.$transaction(async (tx: typeof prisma) => {
        // Double-check user exists
        const user = await tx.user.findUnique({
          where: { id: session.user.id },
        });

        if (!user) {
          throw new Error("User not found");
        }

        return await tx.generatedImage.create({
          data: {
            userId: session.user.id,
            prompt: prompt.trim(),
            imageUrl: storedImageUrl,
            originalUrl: imageUrl, // Keep reference to original
            storedPathname: storedPathname, // For deletion
            provider,
            model: model || null,
            width: safeWidth,
            height: safeHeight,
            steps: safeSteps,
          },
        });
      });
    });

    console.log("Image saved successfully:", savedImage.id);

    return NextResponse.json(
      { success: true, image: savedImage },
      { status: 201 }
    );
  } catch (error) {
    console.error("Save image error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      error,
    });

    // Handle specific Prisma errors
    if (error && typeof error === "object" && "code" in error) {
      const prismaError = error as {
        code: string;
        message?: string;
        meta?: unknown;
      };

      switch (prismaError.code) {
        case "P5010":
        case "P1001":
        case "P1002":
          return NextResponse.json(
            { error: "Database connection failed. Please try again." },
            { status: 503 }
          );
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
              error: `Database error: ${
                prismaError.message || "Unknown database error"
              }`,
            },
            { status: 500 }
          );
      }
    }

    // Handle network/timeout errors
    if (error instanceof Error) {
      if (error.message.includes("timeout")) {
        return NextResponse.json(
          { error: "Request timeout. Please try again." },
          { status: 408 }
        );
      }
      if (
        error.message.includes("ECONNREFUSED") ||
        error.message.includes("ENOTFOUND")
      ) {
        return NextResponse.json(
          { error: "Service temporarily unavailable. Please try again." },
          { status: 503 }
        );
      }
    }

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
