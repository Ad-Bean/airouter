import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { checkCredits, deductCredits } from '@/lib/credits';
import { generateWithOpenAI } from '@/lib/providers/openai';
import { generateWithGoogle } from '@/lib/providers/google';

export type Provider = 'openai' | 'google';

interface GenerateRequest {
  prompt: string;
  provider?: Provider;
  model?: string;
  width?: number;
  height?: number;
  steps?: number;
  n?: number; // For OpenAI models
  sampleCount?: number; // For Google Vertex AI models
  quality?: 'standard' | 'hd' | 'low' | 'medium' | 'high';
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);

    console.log('=== DEBUG SESSION ===');
    console.log('Full session:', JSON.stringify(session, null, 2));
    console.log('Session user:', session?.user);
    console.log('User ID:', session?.user?.id);
    console.log('User email:', session?.user?.email);
    console.log('=== END DEBUG ===');

    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body: GenerateRequest = await request.json();
    const {
      prompt,
      provider = 'openai',
      model,
      width = 1024,
      height = 1024,
      steps = 20,
      n,
      sampleCount,
      quality = 'standard',
    } = body;
    console.log(
      `Generating image with provider: ${provider}, model: ${model}, size: ${width}x${height}, steps: ${steps}, quality: ${quality}`,
    );

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // Calculate generation cost and check credits
    const size = `${width}x${height}`;
    const creditCheck = await checkCredits(session.user.id, provider, model, size, quality);

    if (!creditCheck.hasEnough) {
      return NextResponse.json(
        {
          error: 'Insufficient credits',
          required: creditCheck.required,
          available: creditCheck.available,
          message:
            'You need more credits to generate this image. Please purchase credits in the billing section.',
        },
        { status: 402 },
      );
    }

    let result;

    switch (provider) {
      case 'openai':
        result = await generateWithOpenAI({
          prompt,
          model: (model as 'gpt-image-1' | 'dall-e-2' | 'dall-e-3' | undefined) || 'dall-e-2',
          size: `${width}x${height}` as
            | '256x256'
            | '512x512'
            | '1024x1024'
            | '1792x1024'
            | '1024x1792'
            | '1024x1536'
            | '1536x1024',
          quality: quality as 'standard' | 'hd' | 'low' | 'medium' | 'high',
          n: n || 1,
        });
        break;

      case 'google':
        result = await generateWithGoogle({
          prompt,
          model:
            (model as
              | 'imagen-4-preview'
              | 'imagen-4-standard'
              | 'imagen-4-ultra'
              | 'imagen-3'
              | 'imagen-4.0-generate-preview-06-06'
              | undefined) || 'imagen-4-preview',
          sampleCount: sampleCount || 1,
        });
        break;

      default:
        return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
    }

    // Deduct credits after successful generation
    const usageData = result.usage && 'total_tokens' in result.usage ? result.usage : undefined;
    const deductResult = await deductCredits({
      userId: session.user.id,
      provider,
      model,
      size,
      quality,
      usage: usageData,
      description: `Generated image: ${prompt.substring(0, 100)}${prompt.length > 100 ? '...' : ''}`,
    });

    if (!deductResult.success) {
      console.error('Failed to deduct credits:', deductResult.error);
      // Still return success since image was generated
    }

    return NextResponse.json({
      success: true,
      provider,
      model: model || 'default',
      creditsDeducted: deductResult.creditsDeducted,
      remainingCredits: deductResult.remainingCredits,
      ...result,
    });
  } catch (error) {
    console.error('Generation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate image',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
