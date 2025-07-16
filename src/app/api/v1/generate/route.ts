import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey } from '@/lib/api-key';
import { prisma } from '@/lib/prisma';
import { generateWithOpenAI } from '@/lib/providers/openai';
import { generateWithGoogle } from '@/lib/providers/google';
import { calculateGenerationCost } from '@/config/credits';
import { PROVIDER_CONFIGS } from '@/config/providers';
import { type Provider } from '@/lib/api';

// Get available providers and models
const getAvailableProviders = () => {
  return Object.values(PROVIDER_CONFIGS).filter((config) => config.enabled);
};

const getProviderByName = (name: string) => {
  return PROVIDER_CONFIGS[name as Provider];
};

export async function POST(request: NextRequest) {
  try {
    // Get API key from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        {
          error: 'Missing or invalid Authorization header. Use: Authorization: Bearer YOUR_API_KEY',
        },
        { status: 401 },
      );
    }

    const apiKey = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Validate API key
    const user = await validateApiKey(apiKey);
    if (!user) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { prompt, models, imageCount = 1 } = body;

    // Validate required fields
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid prompt' }, { status: 400 });
    }

    if (imageCount < 1 || imageCount > 10) {
      return NextResponse.json({ error: 'imageCount must be between 1 and 10' }, { status: 400 });
    }

    // Handle models parameter
    let selectedModels: string[] = [];
    if (!models || models === 'auto') {
      // Auto mode: use all available models
      const availableProviders = getAvailableProviders();
      selectedModels = availableProviders.map((provider) => {
        const firstModel = provider.models[0];
        return `${provider.name}:${firstModel.id}`;
      });
    } else if (Array.isArray(models)) {
      // Array mode: validate each model
      selectedModels = models;
      for (const modelStr of selectedModels) {
        const [providerId, modelId] = modelStr.split(':');
        const provider = getProviderByName(providerId);
        if (!provider || !provider.models.find((m) => m.id === modelId)) {
          return NextResponse.json(
            { error: `Invalid model: ${modelStr}. Format: provider:model (e.g., openai:dall-e-3)` },
            { status: 400 },
          );
        }
      }
    } else {
      return NextResponse.json(
        {
          error:
            'models must be "auto" or an array of model strings (e.g., ["openai:dall-e-3", "google:imagen-4"])',
        },
        { status: 400 },
      );
    }

    // Calculate total credits needed
    let totalCreditsNeeded = 0;
    for (const modelStr of selectedModels) {
      const [providerId, modelId] = modelStr.split(':');
      const creditsPerImage = calculateGenerationCost(providerId as Provider, modelId);
      totalCreditsNeeded += creditsPerImage * imageCount;
    }

    // Check if user has enough credits
    if (user.credits < totalCreditsNeeded) {
      return NextResponse.json(
        {
          error: 'Insufficient credits',
          required: totalCreditsNeeded,
          available: user.credits,
        },
        { status: 402 },
      );
    }

    // Generate images
    const results = [];
    let totalCreditsUsed = 0;

    for (const modelStr of selectedModels) {
      const [providerId, modelId] = modelStr.split(':');
      const provider = getProviderByName(providerId);
      const model = provider?.models.find((m) => m.id === modelId);

      if (!provider || !model) {
        continue;
      }

      const creditsPerImage = calculateGenerationCost(providerId as Provider, modelId);

      try {
        let generatedImages: string[] = [];

        if (providerId === 'openai') {
          const openaiResults = await generateWithOpenAI({
            prompt,
            model: modelId as 'gpt-image-1' | 'dall-e-2' | 'dall-e-3',
            n: imageCount,
            size: '1024x1024',
            quality: 'standard',
            style: 'vivid',
          });
          generatedImages = openaiResults.images;
        } else if (providerId === 'google') {
          const googleResults = await generateWithGoogle({
            prompt,
            model: modelId as
              | 'imagen-4-preview'
              | 'imagen-4-standard'
              | 'imagen-4-ultra'
              | 'imagen-4-fast'
              | 'imagen-3'
              | 'imagen-3-fast'
              | 'imagen-4.0-generate-preview-06-06'
              | 'gemini-2.0-flash-preview-image-generation',
            sampleCount: imageCount,
            safetySetting: 'block_few',
          });
          generatedImages = googleResults.images;
        }

        // Store generated images in database
        const imageRecords = await Promise.all(
          generatedImages.map(async (imageUrl) => {
            return await prisma.generatedImage.create({
              data: {
                userId: user.id,
                prompt,
                imageUrl,
                provider: providerId,
                model: modelId,
                width: 1024,
                height: 1024,
                createdAt: new Date(),
              },
            });
          }),
        );

        const creditsUsed = creditsPerImage * imageCount;
        totalCreditsUsed += creditsUsed;

        results.push({
          provider: providerId,
          model: modelId,
          creditsUsed,
          images: imageRecords.map((record) => ({
            id: record.id,
            url: record.imageUrl,
            createdAt: record.createdAt,
          })),
        });
      } catch (error) {
        console.error(`Error generating with ${providerId}:${modelId}:`, error);
        results.push({
          provider: providerId,
          model: modelId,
          creditsUsed: 0,
          error: error instanceof Error ? error.message : 'Generation failed',
        });
      }
    }

    // Deduct credits and create transaction record
    if (totalCreditsUsed > 0) {
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: { credits: { decrement: totalCreditsUsed } },
        select: { credits: true },
      }); // Create transaction record
      await prisma.transaction.create({
        data: {
          userId: user.id,
          type: 'usage',
          amount: -totalCreditsUsed,
          balanceAfter: updatedUser.credits,
          description: `API image generation: ${prompt.substring(0, 100)}${prompt.length > 100 ? '...' : ''}`,
          apiKeyId: user.apiKeyId,
          metadata: {
            prompt,
            models: selectedModels,
            imageCount,
            apiGeneration: true,
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      prompt,
      imageCount,
      totalCreditsUsed,
      remainingCredits: user.credits - totalCreditsUsed,
      results,
    });
  } catch (error) {
    console.error('API generation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
