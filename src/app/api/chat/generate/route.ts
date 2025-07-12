import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma, withDatabaseRetry } from "@/lib/prisma";
import { generateImage, type Provider } from "@/lib/api";
import { uploadImageToS3 } from "@/lib/s3";

// Direct image saving function for internal use
async function saveImageToDatabase({
  prompt,
  imageData,
  provider,
  model,
  width,
  height,
  steps,
  userId,
}: {
  prompt: string;
  imageData: string;
  provider: string;
  model?: string;
  width?: number;
  height?: number;
  steps?: number;
  userId: string;
}) {
  try {
    let imageBuffer: Buffer;
    let mimeType = "image/png";

    // Process image data
    if (imageData.startsWith("data:")) {
      const [header, extractedBase64] = imageData.split(",");
      const mimeMatch = header.match(/data:([^;]+)/);
      if (mimeMatch) {
        mimeType = mimeMatch[1];
      }
      imageBuffer = Buffer.from(extractedBase64, "base64");
    } else {
      imageBuffer = Buffer.from(imageData, "base64");
    }

    // Generate filename
    const timestamp = Date.now();
    const extension = mimeType.split("/")[1] || "png";
    const filename = `generated_${timestamp}.${extension}`;

    let s3Url = null;
    let s3Key = null;
    let s3Bucket = null;

    // Try to upload to S3 if configured
    try {
      const uploadResult = await uploadImageToS3({
        buffer: imageBuffer,
        fileName: filename,
        mimeType,
        userId,
      });
      s3Url = uploadResult.url;
      s3Key = uploadResult.key;
      s3Bucket = uploadResult.bucket;
      console.log("Successfully uploaded to S3:", { s3Key, s3Bucket });
    } catch (s3Error) {
      console.error("Failed to upload to S3:", s3Error);
    }

  // Save to database
  const savedImage = await withDatabaseRetry(async () => {
    // Get user type to determine auto-delete behavior
    // TODO: Fix this after Prisma client is updated
    // const user = await prisma.user.findUnique({
    //   where: { id: userId },
    //   select: { userType: true },
    // });

    // const userType = user?.userType || "free";
    const userType = "free"; // Temporary default
    
    // Calculate auto-delete date based on user type
    const autoDeleteAt = userType === "free" 
      ? new Date(Date.now() + 10 * 60 * 1000) // Free users: 10 minutes
      : new Date(Date.now() + 10 * 24 * 60 * 60 * 1000); // Paid users: 10 days

    return await prisma.generatedImage.create({
      data: {
        userId,
        prompt: prompt.trim(),
        s3Url,
        s3Key,
        s3Bucket,
        mimeType,
        filename,
        provider,
        model: model || "default",
        width: width || 1024,
        height: height || 1024,
        steps: steps || 20,
        isFavorite: false,
        isPublic: false,
        autoDeleteAt,
      },
    });
  });

    return {
      image: savedImage,
      displayUrl: `/api/images/${savedImage.id}`,
    };
  } catch (error) {
    console.error("Error saving image to database:", error);
    throw error;
  }
}

// POST /api/chat/generate - Generate images and stream updates
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sessionId, prompt, providers, models, imageCount } =
      await request.json();

    // Create initial assistant message with generating status
    const assistantMessage = await withDatabaseRetry(async () => {
      return await prisma.chatMessage.create({
        data: {
          sessionId,
          role: "assistant",
          content: prompt, // Store the prompt as content for image messages
          type: "image",
          status: "generating",
          imageUrls: [],
          metadata: {
            providers,
            models,
            imageCount,
            prompt,
          },
        },
      });
    });

    // Start image generation in background
    generateImagesBackground(
      assistantMessage.id,
      prompt,
      providers,
      models,
      imageCount || {},
      session.user.id
    );

    return NextResponse.json({
      success: true,
      messageId: assistantMessage.id,
      message: {
        id: assistantMessage.id,
        role: assistantMessage.role,
        content: assistantMessage.content,
        type: assistantMessage.type,
        status: assistantMessage.status,
        imageUrls: assistantMessage.imageUrls,
        metadata: assistantMessage.metadata,
        timestamp: assistantMessage.createdAt,
      },
    });
  } catch (error) {
    console.error("Error starting image generation:", error);
    return NextResponse.json(
      { error: "Failed to start image generation" },
      { status: 500 }
    );
  }
}

// Background function to generate images and update message
async function generateImagesBackground(
  messageId: string,
  prompt: string,
  providers: Provider[],
  models: Record<string, string>,
  imageCount: Record<string, number>,
  userId: string
) {
  try {
    const generationPromises = providers.map(async (provider) => {
      try {
        const count = imageCount[provider] || 1;
        const generateParams: {
          prompt: string;
          provider: Provider;
          model?: string;
          width: number;
          height: number;
          steps: number;
          n?: number;
          sampleCount?: number;
        } = {
          prompt,
          provider,
          model: models[provider],
          width: 1024,
          height: 1024,
          steps: 20,
        };

        // Add the appropriate count parameter based on provider
        if (provider === "google") {
          generateParams.sampleCount = count;
        } else if (provider === "openai") {
          generateParams.n = count;
        }

        const result = await generateImage(generateParams);
        console.log(`Generated from ${provider}:`, result);

        if (result.success && result.images && result.images.length > 0) {
          // Save images to storage and get URLs
          const imageUrls: string[] = [];

          for (const imageData of result.images) {
            try {
              // Save image directly to database instead of making HTTP call
              const savedImage = await saveImageToDatabase({
                prompt,
                imageData,
                provider,
                model: result.model,
                width: 1024,
                height: 1024,
                steps: 20,
                userId,
              });

              if (savedImage?.displayUrl) {
                imageUrls.push(savedImage.displayUrl);
              }
            } catch (error) {
              console.error(`Error saving image from ${provider}:`, error);
            }
          }

          return imageUrls;
        }

        return [];
      } catch (error) {
        console.error(`Error generating from ${provider}:`, error);
        return [];
      }
    });

    // Wait for all generations to complete
    const results = await Promise.allSettled(generationPromises);
    const allImageUrls: string[] = [];
    const imageProviderMap: Record<string, string> = {};

    results.forEach((result, index) => {
      if (result.status === "fulfilled") {
        const provider = providers[index];
        result.value.forEach((imageUrl) => {
          allImageUrls.push(imageUrl);
          imageProviderMap[imageUrl] = provider;
        });
      }
    });

    // Update message with final results
    await withDatabaseRetry(async () => {
      await prisma.chatMessage.update({
        where: { id: messageId },
        data: {
          status: allImageUrls.length > 0 ? "completed" : "failed",
          imageUrls: allImageUrls,
          metadata: {
            providers,
            models,
            imageCount,
            prompt,
            imageProviderMap,
          },
          updatedAt: new Date(),
        },
      });
    });
  } catch (error) {
    console.error(
      `Error in background generation for message ${messageId}:`,
      error
    );

    // Mark message as failed
    try {
      await withDatabaseRetry(async () => {
        await prisma.chatMessage.update({
          where: { id: messageId },
          data: {
            status: "failed",
            updatedAt: new Date(),
          },
        });
      });
    } catch (updateError) {
      console.error("Error updating message status to failed:", updateError);
    }
  }
}
