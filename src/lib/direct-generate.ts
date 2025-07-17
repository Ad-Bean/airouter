import { checkCredits, deductCredits } from '@/lib/credits';
import { generateWithOpenAI } from '@/lib/providers/openai';
import { generateWithGoogle } from '@/lib/providers/google';

export type Provider = 'openai' | 'google';

export interface GenerateImageParams {
  prompt: string;
  provider?: Provider;
  model?: string;
  width?: number;
  height?: number;
  steps?: number;
  n?: number; // For OpenAI models
  sampleCount?: number; // For Google Vertex AI models
  quality?: 'standard' | 'hd' | 'low' | 'medium' | 'high' | 'auto';
  moderation?: 'auto' | 'low' | null;
  style?: 'vivid' | 'natural' | null;
  safetySetting?: string;
  personGeneration?: string;
  addWatermark?: boolean;
  enhancePrompt?: boolean;
}

export interface GenerateImageResponse {
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

/**
 * Direct image generation function that bypasses HTTP calls
 * Use this for server-to-server calls where you have the user ID
 */
export async function generateImageDirect(
  params: GenerateImageParams,
  userId: string,
): Promise<GenerateImageResponse> {
  const {
    prompt,
    provider = 'openai',
    model,
    width = 1024,
    height = 1024,
    n,
    sampleCount,
    quality = 'auto',
    moderation,
    style,
    safetySetting,
    personGeneration,
    addWatermark,
    enhancePrompt,
  } = params;

  if (!prompt) {
    return {
      success: false,
      provider,
      model: model || 'default',
      images: [],
      error: 'Prompt is required',
    };
  }

  try {
    // Calculate generation cost and check credits
    const size = `${width}x${height}`;
    const creditCheck = await checkCredits(userId, provider, model, size, quality);

    if (!creditCheck.hasEnough) {
      return {
        success: false,
        provider,
        model: model || 'default',
        images: [],
        error: `Insufficient credits. Required: ${creditCheck.required}, Available: ${creditCheck.available}`,
      };
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
          quality: quality as 'standard' | 'hd' | 'low' | 'medium' | 'high' | 'auto',
          moderation: moderation as 'auto' | 'low' | null,
          style: style as 'vivid' | 'natural' | null,
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
              | 'imagen-4-fast'
              | 'imagen-3'
              | 'imagen-3-fast'
              | 'imagen-4.0-generate-preview-06-06'
              | 'gemini-2.0-flash-preview-image-generation'
              | undefined) || 'imagen-4-preview',
          sampleCount: sampleCount || 1,
          safetySetting: safetySetting || 'block_medium_and_above',
          personGeneration: personGeneration || 'allow_adult',
          addWatermark: addWatermark !== false,
          enhancePrompt: enhancePrompt || false,
        });
        break;

      default:
        return {
          success: false,
          provider,
          model: model || 'default',
          images: [],
          error: 'Invalid provider',
        };
    }

    // Deduct credits after successful generation
    let usageData:
      | {
          total_tokens?: number;
          input_tokens?: number;
          output_tokens?: number;
          input_tokens_details?: {
            text_tokens?: number;
            image_tokens?: number;
          };
          promptTokenCount?: number;
          candidatesTokenCount?: number;
          totalTokenCount?: number;
          promptTokensDetails?: Array<{
            modality: string;
            tokenCount: number;
          }>;
          candidatesTokensDetails?: Array<{
            modality: string;
            tokenCount: number;
          }>;
        }
      | undefined = undefined;

    if (result.usage) {
      if ('total_tokens' in result.usage) {
        // OpenAI-style usage data
        usageData = result.usage;
      } else if ('promptTokenCount' in result.usage || 'candidatesTokenCount' in result.usage) {
        // Google-style usage data
        usageData = result.usage;
      }
    }

    const deductResult = await deductCredits({
      userId,
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

    return {
      success: true,
      provider,
      model: model || 'default',
      creditsDeducted: deductResult.creditsDeducted,
      remainingCredits: deductResult.remainingCredits,
      ...result,
    };
  } catch (error) {
    console.error(`Error in generateImageDirect for provider ${provider}:`, error);
    return {
      success: false,
      provider,
      model: model || 'default',
      images: [],
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
