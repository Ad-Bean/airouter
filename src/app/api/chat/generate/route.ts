import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma, withDatabaseRetry } from '@/lib/prisma';
import { generateImageDirect, type Provider } from '@/lib/direct-generate';
import { uploadImageToS3 } from '@/lib/s3';
import { getAutoDeleteDate } from '@/lib/storage-utils';

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
    let mimeType = 'image/png';

    // Process image data
    if (imageData.startsWith('data:')) {
      const [header, extractedBase64] = imageData.split(',');
      const mimeMatch = header.match(/data:([^;]+)/);
      if (mimeMatch) {
        mimeType = mimeMatch[1];
      }
      imageBuffer = Buffer.from(extractedBase64, 'base64');
    } else {
      imageBuffer = Buffer.from(imageData, 'base64');
    }

    // Generate filename
    const timestamp = Date.now();
    const extension = mimeType.split('/')[1] || 'png';
    const filename = `generated_${timestamp}.${extension}`;

    let s3Url = '';
    let s3Key = '';
    let s3Bucket = '';

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
      console.log('Successfully uploaded to S3:', { s3Key, s3Bucket });
    } catch (s3Error) {
      console.error('Failed to upload to S3:', s3Error);
    }

    // Save to database
    const savedImage = await withDatabaseRetry(async () => {
      // Get user type to determine auto-delete behavior
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { userType: true },
      });

      const userType = user?.userType || 'free';

      // Calculate auto-delete date based on user type
      const autoDeleteAt =
        userType === 'free'
          ? new Date(Date.now() + 10 * 60 * 1000) // Free users: 10 minutes
          : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Paid users: 7 days

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
          model: model || 'default',
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
    console.error('Error saving image to database:', error);
    throw error;
  }
}

// POST /api/chat/generate - Generate images and stream updates
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      sessionId,
      prompt,
      providers,
      models,
      imageCount,
      modelOptions = {},
      messageId,
    }: {
      sessionId: string;
      prompt: string;
      providers: Provider[];
      models: Record<string, string>;
      imageCount: Record<string, number>;
      modelOptions: Record<
        string,
        {
          quality?: 'auto' | 'standard' | 'low' | 'medium' | 'high' | 'hd';
          moderation?: 'auto' | 'low' | null;
          style?: 'vivid' | 'natural' | null;
          safetySetting?: string;
          personGeneration?: string;
          addWatermark?: boolean;
          enhancePrompt?: boolean;
        }
      >;
      messageId: string;
    } = await request.json();

    let assistantMessage;

    // If messageId is provided (from frontend), update existing message
    if (messageId) {
      try {
        assistantMessage = await withDatabaseRetry(async () => {
          // Check if message already exists
          const existing = await prisma.chatMessage.findUnique({
            where: { id: messageId },
          });

          if (existing) {
            // Update existing message
            return await prisma.chatMessage.update({
              where: { id: messageId },
              data: {
                sessionId,
                role: 'assistant',
                content: prompt,
                type: 'image',
                status: 'generating',
                imageUrls: [],
                metadata: {
                  providers,
                  models,
                  imageCount,
                  prompt,
                },
              },
            });
          } else {
            // Create new message with specific ID
            return await prisma.chatMessage.create({
              data: {
                id: messageId,
                sessionId,
                role: 'assistant',
                content: prompt,
                type: 'image',
                status: 'generating',
                imageUrls: [],
                metadata: {
                  providers,
                  models,
                  imageCount,
                  prompt,
                },
              },
            });
          }
        });
      } catch (error) {
        console.error('Error handling message with ID:', error);
        // Fall back to creating new message
        assistantMessage = await withDatabaseRetry(async () => {
          return await prisma.chatMessage.create({
            data: {
              sessionId,
              role: 'assistant',
              content: prompt,
              type: 'image',
              status: 'generating',
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
      }
    } else {
      // Create initial assistant message with generating status
      assistantMessage = await withDatabaseRetry(async () => {
        return await prisma.chatMessage.create({
          data: {
            sessionId,
            role: 'assistant',
            content: prompt,
            type: 'image',
            status: 'generating',
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
    }

    // Start image generation in background
    generateImagesBackground(
      assistantMessage.id,
      prompt,
      providers,
      models,
      imageCount || {},
      modelOptions,
      session.user.id,
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
    console.error('Error starting image generation:', error);
    return NextResponse.json({ error: 'Failed to start image generation' }, { status: 500 });
  }
}

// Background function to generate images and update message
async function generateImagesBackground(
  messageId: string,
  prompt: string,
  providers: Provider[],
  models: Record<string, string>,
  imageCount: Record<string, number>,
  modelOptions: Record<
    string,
    {
      quality?: 'auto' | 'standard' | 'low' | 'medium' | 'high' | 'hd';
      moderation?: 'auto' | 'low' | null;
      style?: 'vivid' | 'natural' | null;
      safetySetting?: string;
      personGeneration?: string;
      addWatermark?: boolean;
      enhancePrompt?: boolean;
    }
  >,
  userId: string,
) {
  try {
    // Helper function to update message with new images progressively
    async function updateMessageWithNewImages(completedProvider: string, newImageUrls: string[]) {
      try {
        // Get current message state
        const currentMessage = await prisma.chatMessage.findUnique({
          where: { id: messageId },
          select: { imageUrls: true, metadata: true },
        });

        if (!currentMessage) return;

        // Merge new images with existing ones
        const existingUrls = currentMessage.imageUrls || [];
        const allUrls = [...existingUrls, ...newImageUrls];

        // Update image provider map
        const currentMetadata = (currentMessage.metadata as Record<string, unknown>) || {};
        const imageProviderMap = (currentMetadata.imageProviderMap as Record<string, string>) || {};

        newImageUrls.forEach((url) => {
          imageProviderMap[url] = completedProvider;
        });

        // Update the message with new images while keeping it in "generating" status
        await prisma.chatMessage.update({
          where: { id: messageId },
          data: {
            imageUrls: allUrls,
            metadata: {
              ...currentMetadata,
              imageProviderMap,
            },
            updatedAt: new Date(),
          },
        });

        console.log(
          `Updated message ${messageId} with ${newImageUrls.length} new images from ${completedProvider}. Total images: ${allUrls.length}`,
        );
      } catch (error) {
        console.error(`Error updating message with new images:`, error);
      }
    }

    const generationPromises = providers.map(async (provider) => {
      try {
        const count = imageCount[provider] || 1;
        const currentOptions = modelOptions[provider] || {};
        const generateParams: {
          prompt: string;
          provider: Provider;
          model?: string;
          width: number;
          height: number;
          steps: number;
          n?: number;
          sampleCount?: number;
          quality?: 'auto' | 'standard' | 'low' | 'medium' | 'high' | 'hd';
          moderation?: 'auto' | 'low' | null;
          style?: 'vivid' | 'natural' | null;
          safetySetting?: string;
          personGeneration?: string;
          addWatermark?: boolean;
          enhancePrompt?: boolean;
        } = {
          prompt,
          provider,
          model: models[provider],
          width: 1024,
          height: 1024,
          steps: 20,
          // Add model-specific options with proper typing
          quality: currentOptions.quality as 'auto' | 'standard' | 'low' | 'medium' | 'high' | 'hd',
          moderation: currentOptions.moderation,
          style: currentOptions.style,
          safetySetting: currentOptions.safetySetting,
          personGeneration: currentOptions.personGeneration,
          addWatermark: currentOptions.addWatermark,
          enhancePrompt: currentOptions.enhancePrompt,
        };

        // Add the appropriate count parameter based on provider
        if (provider === 'google') {
          generateParams.sampleCount = count;
        } else if (provider === 'openai') {
          generateParams.n = count;
        }

        const result = await generateImageDirect(generateParams, userId);
        // console.log(`Generated from ${provider}:`, result);

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

          // Update message immediately with new images
          if (imageUrls.length > 0) {
            await updateMessageWithNewImages(provider, imageUrls);
          }

          return { success: true, provider, imageUrls, error: null };
        }

        return {
          success: false,
          provider,
          imageUrls: [],
          error: result.error || 'No images generated',
        };
      } catch (error) {
        console.error(`Error generating from ${provider}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return { success: false, provider, imageUrls: [], error: errorMessage };
      }
    });

    // Wait for all generations to complete
    const results = await Promise.allSettled(generationPromises);
    const allImageUrls: string[] = [];
    const imageProviderMap: Record<string, string> = {};
    const providerErrors: Record<string, string> = {};

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        const providerResult = result.value;
        const provider = providers[index];

        console.log(`Provider ${provider} result:`, providerResult);

        if (providerResult.success) {
          providerResult.imageUrls.forEach((imageUrl) => {
            allImageUrls.push(imageUrl);
            imageProviderMap[imageUrl] = provider;
          });
        } else if (providerResult.error) {
          providerErrors[provider] = providerResult.error;
        }
      } else {
        const provider = providers[index];
        console.log(`Provider ${provider} rejected:`, result.reason);
        providerErrors[provider] = result.reason?.message || 'Generation failed';
      }
    });

    // Update message with final results
    await withDatabaseRetry(async () => {
      const hasImages = allImageUrls.length > 0;
      const hasErrors = Object.keys(providerErrors).length > 0;

      // Determine status based on results
      let status: 'completed' | 'failed' | 'partial';
      if (hasImages && !hasErrors) {
        status = 'completed';
      } else if (hasImages && hasErrors) {
        status = 'partial';
      } else {
        status = 'failed';
      }

      // Get user type for expiration info
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { userType: true },
      });

      const userType = user?.userType || 'free';
      const autoDeleteAt = hasImages ? getAutoDeleteDate(userType) : undefined;

      console.log(
        `Updating message ${messageId} with status: ${status}, images: ${allImageUrls.length}, errors: ${Object.keys(providerErrors).length}`,
      );

      await prisma.chatMessage.update({
        where: { id: messageId },
        data: {
          status,
          imageUrls: allImageUrls,
          metadata: {
            providers,
            models,
            imageCount,
            prompt,
            imageProviderMap,
            providerErrors: Object.keys(providerErrors).length > 0 ? providerErrors : undefined,
            autoDeleteAt: autoDeleteAt?.toISOString(),
            userType: userType as 'free' | 'paid',
          },
          updatedAt: new Date(),
        },
      });
    });
  } catch (error) {
    console.error(`Error in background generation for message ${messageId}:`, error);

    // Mark message as failed
    try {
      await withDatabaseRetry(async () => {
        console.log(`Marking message ${messageId} as failed due to error`);
        await prisma.chatMessage.update({
          where: { id: messageId },
          data: {
            status: 'failed',
            metadata: {
              providers,
              models,
              imageCount,
              prompt,
              error: error instanceof Error ? error.message : 'Unknown error',
            },
            updatedAt: new Date(),
          },
        });
      });
    } catch (updateError) {
      console.error('Error updating message status to failed:', updateError);
    }
  }
}
