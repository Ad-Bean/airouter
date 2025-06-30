import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadImageToS3 } from "@/lib/s3";

export async function POST(request: NextRequest) {
  try {
    const requestData = await request.json();
    const session = await getServerSession(authOptions);

    // For development, create a test user if needed
    let userId = session?.user?.id;

    if (!userId) {
      // Create or get test user for development
      let testUser = await prisma.user.findFirst({
        where: { email: "test@example.com" },
      });

      if (!testUser) {
        testUser = await prisma.user.create({
          data: {
            email: "test@example.com",
            name: "Test User",
          },
        });
      }

      userId = testUser.id;
    }

    const { prompt, imageData, provider, model, width, height, steps } =
      requestData;

    // Validate required fields
    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: "Prompt is required and must be a non-empty string" },
        { status: 400 }
      );
    }

    if (!provider || typeof provider !== "string") {
      return NextResponse.json(
        { error: "Provider is required and must be a string" },
        { status: 400 }
      );
    }

    // Validate optional numeric fields
    if (width !== undefined && (typeof width !== "number" || width <= 0)) {
      return NextResponse.json(
        { error: "Width must be a positive number" },
        { status: 400 }
      );
    }

    if (height !== undefined && (typeof height !== "number" || height <= 0)) {
      return NextResponse.json(
        { error: "Height must be a positive number" },
        { status: 400 }
      );
    }

    if (steps !== undefined && (typeof steps !== "number" || steps <= 0)) {
      return NextResponse.json(
        { error: "Steps must be a positive number" },
        { status: 400 }
      );
    }

    let imageBuffer: Buffer;
    let base64Data: string;
    let mimeType = "image/png";

    // Validate imageData
    if (!imageData || typeof imageData !== "string") {
      return NextResponse.json(
        { error: "Invalid image data format" },
        { status: 400 }
      );
    }

    try {
      if (imageData.startsWith("data:")) {
        const [header, extractedBase64] = imageData.split(",");
        const mimeMatch = header.match(/data:([^;]+)/);
        if (mimeMatch) {
          mimeType = mimeMatch[1];
        }
        base64Data = extractedBase64;
        imageBuffer = Buffer.from(extractedBase64, "base64");
      } else {
        base64Data = imageData;
        imageBuffer = Buffer.from(imageData, "base64");
      }
    } catch (bufferError) {
      console.error("Error creating buffer from image data:", bufferError);
      return NextResponse.json(
        { error: "Invalid base64 image data" },
        { status: 400 }
      );
    }

    // Check image size limit (10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (imageBuffer.length > maxSize) {
      return NextResponse.json(
        {
          error: `Image too large. Maximum size is ${
            maxSize / (1024 * 1024)
          }MB`,
        },
        { status: 400 }
      );
    }

    // Generate filename
    const extension = mimeType.split("/")[1] || "png";
    const filename = `${provider}_${Date.now()}.${extension}`;

    // Upload to S3
    let s3Result;
    try {
      // Check if S3 is configured
      if (
        !process.env.AWS_ACCESS_KEY_ID ||
        !process.env.AWS_SECRET_ACCESS_KEY ||
        !process.env.AWS_S3_BUCKET_NAME
      ) {
        console.warn("S3 not configured, creating mock URLs for development");
        s3Result = {
          key: `mock/${filename}`,
          url: `/api/images/mock/${filename}`,
          bucket: "development-bucket",
        };
      } else {
        s3Result = await uploadImageToS3({
          buffer: imageBuffer,
          fileName: filename,
          mimeType,
          userId,
        });
      }
    } catch (s3Error) {
      console.error("S3 upload failed:", s3Error);
      // Fallback to mock URLs for development
      console.warn("Falling back to mock URLs for development");
      s3Result = {
        key: `mock/${filename}`,
        url: `/api/images/mock/${filename}`,
        bucket: "development-bucket",
      };
    }

    console.log("Attempting to save image with data:", {
      userId,
      prompt: prompt.trim().substring(0, 100) + "...",
      imageDataSize: imageBuffer.length,
      base64Size: base64Data.length,
      mimeType,
      filename,
      s3Key: s3Result.key,
      s3Url: s3Result.url,
      provider,
      model: model || null,
      width: width || 1024,
      height: height || 1024,
      steps: steps || 20,
    });

    // Verify user exists
    const userExists = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!userExists) {
      console.error("User not found:", userId);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Save to database
    const savedImage = await prisma.generatedImage.create({
      data: {
        userId: userId,
        prompt: prompt.trim(),
        s3Key: s3Result.key,
        s3Url: s3Result.url,
        s3Bucket: s3Result.bucket,
        mimeType: mimeType,
        filename: filename,
        provider,
        model: model || null,
        width: width || 1024,
        height: height || 1024,
        steps: steps || 20,
      },
    });

    // Return success response
    return NextResponse.json(
      {
        success: true,
        image: {
          id: savedImage.id,
          prompt: savedImage.prompt,
          provider: savedImage.provider,
          model: savedImage.model,
          width: savedImage.width,
          height: savedImage.height,
          steps: savedImage.steps,
          createdAt: savedImage.createdAt,
          displayUrl: `/api/images/${savedImage.id}`,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Save image error:", error);

    // Log more detailed error information
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }

    // Check if it's a Prisma error
    if (error && typeof error === "object" && "code" in error) {
      console.error("Prisma error code:", error.code);
      if ("meta" in error) {
        console.error("Prisma error meta:", error.meta);
      }
    }

    return NextResponse.json(
      {
        error: "Failed to save image",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
