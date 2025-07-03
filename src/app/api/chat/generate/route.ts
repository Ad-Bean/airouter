import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma, withDatabaseRetry } from "@/lib/prisma";
import { generateImage, type Provider } from "@/lib/api";

// POST /api/chat/generate - Generate images and stream updates
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sessionId, prompt, providers, models } = await request.json();

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
            prompt,
          },
        },
      });
    });

    // Start image generation in background
    generateImagesBackground(assistantMessage.id, prompt, providers, models);

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
  models: Record<string, string>
) {
  try {
    const generationPromises = providers.map(async (provider) => {
      try {
        const result = await generateImage({
          prompt,
          provider,
          model: models[provider],
          width: 1024,
          height: 1024,
          steps: 20,
        });
        console.log(`Generated from ${provider}:`, result);

        if (result.success && result.images && result.images.length > 0) {
          // Save images to storage and get URLs
          const imageUrls: string[] = [];

          for (const imageData of result.images) {
            try {
              const saveResponse = await fetch(
                `${process.env.NEXTAUTH_URL}/api/images/save`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    prompt,
                    imageData,
                    provider,
                    model: result.model,
                    width: 1024,
                    height: 1024,
                    steps: 20,
                  }),
                }
              );

              if (saveResponse.ok) {
                const saveData = await saveResponse.json();
                if (saveData.image?.displayUrl) {
                  imageUrls.push(saveData.image.displayUrl);
                }
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

    results.forEach((result) => {
      if (result.status === "fulfilled") {
        allImageUrls.push(...result.value);
      }
    });

    // Update message with final results
    await withDatabaseRetry(async () => {
      await prisma.chatMessage.update({
        where: { id: messageId },
        data: {
          status: allImageUrls.length > 0 ? "completed" : "failed",
          imageUrls: allImageUrls,
          updatedAt: new Date(),
        },
      });
    });

    // Update session timestamp
    const message = await prisma.chatMessage.findUnique({
      where: { id: messageId },
    });

    if (message) {
      await prisma.chatSession.update({
        where: { id: message.sessionId },
        data: { updatedAt: new Date() },
      });
    }

    console.log(
      `Completed generation for message ${messageId}, generated ${allImageUrls.length} images`
    );
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
