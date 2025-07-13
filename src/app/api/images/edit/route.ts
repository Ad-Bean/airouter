import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma, withDatabaseRetry } from '@/lib/prisma';
import { uploadImageToS3 } from '@/lib/s3';
import { getAutoDeleteDate } from '@/lib/storage-utils';
import { type Provider } from '@/lib/direct-generate';
import { editImageWithOpenAI, type OpenAIEditResponse } from '@/lib/providers/openai';
import { editImageWithGoogle, type GoogleEditResponse } from '@/lib/providers/google';

export interface EditImageParams {
  imageUrl: string;
  prompt: string;
  provider: Provider;
  model?: string;
  sessionId?: string;
  messageId?: string;
}

export interface EditImageResponse {
  success: boolean;
  provider: Provider;
  model: string;
  images: string[];
  usage?: {
    total_tokens?: number;
    input_tokens?: number;
    output_tokens?: number;
    input_tokens_details?: {
      text_tokens?: number;
      image_tokens?: number;
    };
    credits_consumed?: number;
    prediction_id?: string;
  };
  creditsDeducted?: number;
  remainingCredits?: number;
  error?: string;
  details?: string;
}

// Helper function to get image buffer from either URL or database
async function getImageBuffer(imageUrl: string, userId: string): Promise<Buffer> {
  // If it's a relative URL to our API, get the image data directly
  if (imageUrl.startsWith('/api/images/')) {
    const imageId = imageUrl.split('/').pop();

    if (!imageId) {
      throw new Error('Invalid image URL format');
    }

    // Get the image record from database
    const imageRecord = await withDatabaseRetry(async () => {
      return await prisma.generatedImage.findUnique({
        where: { id: imageId },
        select: {
          s3Url: true,
          s3Key: true,
          s3Bucket: true,
          userId: true,
          deleted: true,
        },
      });
    });

    if (!imageRecord) {
      throw new Error(`Image not found: ${imageId}`);
    }

    if (imageRecord.deleted) {
      throw new Error('Image has been deleted');
    }

    // Verify user owns the image
    if (imageRecord.userId !== userId) {
      throw new Error('Access denied: You can only edit your own images');
    }

    // If we have S3 URL, fetch from there
    if (imageRecord.s3Url) {
      const response = await fetch(imageRecord.s3Url);
      if (!response.ok) {
        throw new Error(`Failed to fetch image from S3: ${response.status}`);
      }
      return Buffer.from(await response.arrayBuffer());
    } else {
      // For legacy images or local development, try the API endpoint with full URL
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
      const fullUrl = `${baseUrl}${imageUrl}`;
      const response = await fetch(fullUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`);
      }
      return Buffer.from(await response.arrayBuffer());
    }
  } else {
    // Handle absolute URLs (external images or full URLs)
    let absoluteUrl = imageUrl;

    // Convert relative URLs to absolute
    if (imageUrl.startsWith('/')) {
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
      absoluteUrl = `${baseUrl}${imageUrl}`;
    }

    const response = await fetch(absoluteUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }
    return Buffer.from(await response.arrayBuffer());
  }
}

// Direct image editing function
async function editImageDirect(
  params: EditImageParams,
  userId: string,
  sessionId?: string,
): Promise<EditImageResponse> {
  const { imageUrl, prompt, provider, model } = params;

  if (!prompt) {
    return {
      success: false,
      provider,
      model: model || 'default',
      images: [],
      error: 'Prompt is required for image editing',
    };
  }

  try {
    // Check if user is paid
    const user = await withDatabaseRetry(async () => {
      return await prisma.user.findUnique({
        where: { id: userId },
        select: { userType: true, credits: true },
      });
    });

    if (!user) {
      return {
        success: false,
        provider,
        model: model || 'default',
        images: [],
        error: 'User not found',
      };
    }

    // Only allow paid users to edit images
    if (user.userType !== 'paid') {
      return {
        success: false,
        provider,
        model: model || 'default',
        images: [],
        error: 'Image editing is only available for paid users. Please upgrade your account.',
      };
    }

    // Save user edit message to database if sessionId is provided
    if (sessionId) {
      try {
        await withDatabaseRetry(async () => {
          await prisma.chatMessage.create({
            data: {
              sessionId,
              role: 'user',
              content: `Edit image: ${prompt}`,
              type: 'text',
              createdAt: new Date(),
            },
          });
        });
      } catch (error) {
        console.error('Error saving user edit message:', error);
      }
    }

    // Download the image from URL
    let imageBuffer: Buffer;
    try {
      imageBuffer = await getImageBuffer(imageUrl, userId);
    } catch (error) {
      return {
        success: false,
        provider,
        model: model || 'default',
        images: [],
        error: `Failed to download image: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }

    // Edit image based on provider
    let providerResult: OpenAIEditResponse | GoogleEditResponse;
    switch (provider) {
      case 'openai':
        providerResult = await editImageWithOpenAI({
          imageBuffer,
          prompt,
          model: model as 'gpt-image-1' | 'dall-e-2',
        });
        break;
      case 'google':
        providerResult = await editImageWithGoogle({
          imageBuffer,
          prompt,
          model: model as 'gemini-2.0-flash-preview-image-generation',
        });
        break;
      default:
        return {
          success: false,
          provider,
          model: model || 'default',
          images: [],
          error: `Provider ${provider} does not support image editing`,
        };
    }

    return {
      success: true,
      provider,
      model: providerResult.model || model || 'default',
      images: providerResult.images || [],
      usage: providerResult.usage,
    };
  } catch (error) {
    console.error(`Error editing image with ${provider}:`, error);
    return {
      success: false,
      provider,
      model: model || 'default',
      images: [],
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

// POST /api/images/edit - Edit an image
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { imageUrl, prompt, provider, model, sessionId, messageId } = await request.json();

    // Validate required fields
    if (!imageUrl || !prompt || !provider) {
      return NextResponse.json(
        { error: 'imageUrl, prompt, and provider are required' },
        { status: 400 },
      );
    }

    // Edit the image
    const result = await editImageDirect(
      {
        imageUrl,
        prompt,
        provider,
        model,
        sessionId,
        messageId,
      },
      session.user.id,
      sessionId,
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to edit image' }, { status: 400 });
    }

    // Save edited images to database and get URLs
    const savedImages: string[] = [];
    for (const imageData of result.images) {
      try {
        const savedImage = await saveEditedImageToDatabase({
          prompt: `Edit: ${prompt}`,
          imageData,
          provider,
          model: result.model,
          width: 1024,
          height: 1024,
          userId: session.user.id,
        });

        if (savedImage?.displayUrl) {
          savedImages.push(savedImage.displayUrl);
        }
      } catch (error) {
        console.error('Error saving edited image:', error);
      }
    }

    // Update chat message if sessionId and messageId are provided
    if (sessionId && messageId) {
      try {
        await withDatabaseRetry(async () => {
          // First, try to create the user edit message
          try {
            await prisma.chatMessage.create({
              data: {
                sessionId: sessionId,
                role: 'user',
                content: `Edit image: ${prompt}`,
                type: 'text',
                status: null,
                imageUrls: [],
                metadata: {},
              },
            });
          } catch (error) {
            // User message might already exist, ignore the error
            console.log('User edit message might already exist:', error);
          }

          // Create the assistant edit message in the database
          await prisma.chatMessage.create({
            data: {
              id: messageId,
              sessionId: sessionId,
              role: 'assistant',
              content: '',
              type: 'image',
              status: 'completed',
              imageUrls: savedImages,
              metadata: {
                providers: [provider],
                models: { [provider]: model },
                imageCount: { [provider]: 1 },
                prompt: prompt,
                isEdit: true,
                originalImageUrl: imageUrl,
                imageProviderMap: savedImages.reduce((acc: Record<string, string>, img: string) => {
                  acc[img] = provider;
                  return acc;
                }, {}),
              },
            },
          });
        });
      } catch (error) {
        console.error('Error creating chat message:', error);
      }
    }

    return NextResponse.json({
      success: true,
      images: savedImages,
      usage: result.usage,
      creditsDeducted: result.creditsDeducted,
      remainingCredits: result.remainingCredits,
    });
  } catch (error) {
    console.error('Error in image edit API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to save edited image to database
async function saveEditedImageToDatabase({
  prompt,
  imageData,
  provider,
  model,
  width,
  height,
  userId,
}: {
  prompt: string;
  imageData: string;
  provider: string;
  model?: string;
  width?: number;
  height?: number;
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
    const filename = `edited_${timestamp}.${extension}`;

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
    } catch (s3Error) {
      console.error('Failed to upload edited image to S3:', s3Error);
    }

    // Save to database
    const savedImage = await withDatabaseRetry(async () => {
      // Get user type to determine auto-delete behavior
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { userType: true },
      });

      const userType = user?.userType || 'free';
      const autoDeleteAt = getAutoDeleteDate(userType);

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
          steps: 1, // Edited images don't have steps
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
    console.error('Error saving edited image to database:', error);
    throw error;
  }
}
