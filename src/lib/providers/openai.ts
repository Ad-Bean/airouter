import OpenAI from 'openai';
import sharp from 'sharp';

let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
}

export interface OpenAIGenerateParams {
  prompt: string;
  model?: 'gpt-image-1' | 'dall-e-2' | 'dall-e-3';
  size?:
    | '256x256'
    | '512x512'
    | '1024x1024'
    | '1792x1024'
    | '1024x1792'
    | '1024x1536'
    | '1536x1024';
  quality?: 'standard' | 'hd' | 'low' | 'medium' | 'high';
  n?: number;
}

export interface OpenAIGenerateResponse {
  images: string[];
  usage?: {
    total_tokens?: number;
    input_tokens?: number;
    output_tokens?: number;
    input_tokens_details?: {
      text_tokens?: number;
      image_tokens?: number;
    };
  };
  model?: string;
  size?: string;
  quality?: string;
}

export async function generateWithOpenAI(
  params: OpenAIGenerateParams,
): Promise<OpenAIGenerateResponse> {
  const {
    prompt,
    model = 'dall-e-2', // Default to DALL-E 2 for better compatibility
    size = '1024x1024',
    quality = 'standard',
    n = 1,
  } = params;

  const openai = getOpenAIClient();

  try {
    // Validate and sanitize inputs
    const sanitizedPrompt = prompt.trim();
    if (!sanitizedPrompt) {
      throw new Error('Prompt cannot be empty');
    }

    // Ensure we use a compatible size for the model
    let compatibleSize = size;
    if (model === 'dall-e-2' && !['256x256', '512x512', '1024x1024'].includes(size)) {
      compatibleSize = '1024x1024'; // DALL-E 2 fallback
    }

    // Map quality for GPT-Image-1
    let gptImageQuality = quality;
    if (model === 'gpt-image-1') {
      // GPT-Image-1 uses low/medium/high instead of standard/hd
      if (quality === 'standard') {
        gptImageQuality = 'low';
      } else if (quality === 'hd') {
        gptImageQuality = 'high';
      }
    }

    console.log(
      `Attempting OpenAI generation with model: ${model}, size: ${compatibleSize}, quality: ${gptImageQuality}`,
    );

    // Build request parameters based on model
    const baseParams = {
      model: model as 'gpt-image-1' | 'dall-e-2' | 'dall-e-3',
      prompt: sanitizedPrompt,
      size: compatibleSize as
        | '256x256'
        | '512x512'
        | '1024x1024'
        | '1792x1024'
        | '1024x1792'
        | '1024x1536'
        | '1536x1024',
    };

    type RequestParams =
      | {
          model: 'gpt-image-1';
          prompt: string;
          size:
            | '256x256'
            | '512x512'
            | '1024x1024'
            | '1792x1024'
            | '1024x1792'
            | '1024x1536'
            | '1536x1024';
          quality?: 'low' | 'medium' | 'high';
          n?: number;
        }
      | {
          model: 'dall-e-2' | 'dall-e-3';
          prompt: string;
          size:
            | '256x256'
            | '512x512'
            | '1024x1024'
            | '1792x1024'
            | '1024x1792'
            | '1024x1536'
            | '1536x1024';
          response_format: 'b64_json';
          quality?: 'standard' | 'hd';
          n?: number;
        };

    let requestParams: RequestParams;

    // Model-specific parameters
    if (model === 'gpt-image-1') {
      // GPT Image 1 doesn't support response_format and always returns base64
      requestParams = {
        ...baseParams,
        model: 'gpt-image-1',
        quality: gptImageQuality as 'low' | 'medium' | 'high',
        n: Math.min(n, 10), // GPT Image 1 supports up to 10 images
      };
    } else if (model === 'dall-e-3') {
      // DALL-E 3 parameters
      requestParams = {
        ...baseParams,
        model: 'dall-e-3',
        response_format: 'b64_json', // Request base64 data instead of URLs
        quality: quality as 'standard' | 'hd',
        n: 1, // DALL-E 3 only supports n=1
      };
    } else {
      // DALL-E 2 parameters
      requestParams = {
        ...baseParams,
        model: 'dall-e-2',
        response_format: 'b64_json', // Request base64 data instead of URLs
        n: Math.min(n, 10), // DALL-E 2 supports up to 10 images
      };
    }

    const response = await openai.images.generate(requestParams);

    // Handle different response formats based on model
    const images: string[] = [];

    for (const item of response.data || []) {
      // Type for potential different response formats
      const responseItem = item as {
        b64_json?: string | null;
        data?: string | null;
        url?: string | null;
      };

      if (model === 'gpt-image-1') {
        // GPT Image 1 returns base64 data (format may vary)
        if (responseItem.b64_json) {
          images.push(`data:image/png;base64,${responseItem.b64_json}`);
        } else if (responseItem.data) {
          // Handle potential different response format for gpt-image-1
          images.push(`data:image/png;base64,${responseItem.data}`);
        }
      } else {
        // DALL-E 2 and 3 with b64_json format
        if (responseItem.b64_json) {
          images.push(`data:image/png;base64,${responseItem.b64_json}`);
        }
      }
    }

    if (images.length === 0) {
      throw new Error('No images returned from OpenAI');
    }

    // Extract usage information if available (GPT-Image-1 may include usage)
    const responseWithUsage = response as typeof response & {
      usage?: {
        total_tokens?: number;
        input_tokens?: number;
        output_tokens?: number;
        input_tokens_details?: {
          text_tokens?: number;
          image_tokens?: number;
        };
      };
    };

    return {
      images,
      usage: {
        total_tokens: responseWithUsage.usage?.total_tokens || sanitizedPrompt.length, // Use actual or rough estimate
        input_tokens: responseWithUsage.usage?.input_tokens,
        output_tokens: responseWithUsage.usage?.output_tokens,
        input_tokens_details: responseWithUsage.usage?.input_tokens_details,
      },
      model,
      size: compatibleSize,
      quality: gptImageQuality,
    };
  } catch (error: unknown) {
    console.error('OpenAI generation error:', error);

    // If DALL-E 3 fails and we haven't tried DALL-E 2 yet, try DALL-E 2
    if (model === 'dall-e-3') {
      console.log('DALL-E 3 failed, trying DALL-E 2 as fallback...');
      try {
        return await generateWithOpenAI({
          ...params,
          model: 'dall-e-2',
          size: '1024x1024', // Ensure compatible size
        });
      } catch (fallbackError) {
        console.error('DALL-E 2 fallback also failed:', fallbackError);
      }
    }

    // More detailed error handling
    let errorMessage = 'Unknown error';

    if (error && typeof error === 'object') {
      const err = error as Record<string, unknown>;

      if (err.error && typeof err.error === 'object') {
        const innerErr = err.error as Record<string, unknown>;
        if (typeof innerErr.message === 'string') {
          errorMessage = innerErr.message;
        }
      } else if (typeof err.message === 'string') {
        errorMessage = err.message;
      } else if (typeof err.type === 'string') {
        switch (err.type) {
          case 'image_generation_user_error':
            errorMessage =
              'Unable to generate image. This may be due to content policy restrictions, billing limits, or account configuration. Please check your OpenAI account status and try a different prompt.';
            break;
          case 'invalid_request_error':
            errorMessage = 'Invalid request format.';
            break;
          case 'rate_limit_exceeded':
            errorMessage = 'Rate limit exceeded. Please try again later.';
            break;
          case 'insufficient_quota':
            errorMessage = 'Insufficient quota. Please check your OpenAI billing.';
            break;
          default:
            errorMessage = `OpenAI error: ${err.type}`;
        }
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    throw new Error(`OpenAI generation failed: ${errorMessage}`);
  }
}

export interface OpenAIEditParams {
  imageBuffer: Buffer;
  prompt: string;
  model?: 'gpt-image-1' | 'dall-e-2';
  size?:
    | '256x256'
    | '512x512'
    | '1024x1024'
    | '1792x1024'
    | '1024x1792'
    | '1024x1536'
    | '1536x1024';
  quality?: 'standard' | 'hd' | 'low' | 'medium' | 'high';
  n?: number;
}

export interface OpenAIEditResponse {
  images: string[];
  usage?: {
    total_tokens?: number;
    input_tokens?: number;
    output_tokens?: number;
    input_tokens_details?: {
      text_tokens?: number;
      image_tokens?: number;
    };
  };
  model?: string;
  size?: string;
  quality?: string;
}

export async function editImageWithOpenAI(params: OpenAIEditParams): Promise<OpenAIEditResponse> {
  const {
    imageBuffer,
    prompt,
    model = 'gpt-image-1', // Default to GPT-Image-1 for editing
    size = '1024x1024',
    quality = 'standard',
    n = 1,
  } = params;

  const openai = getOpenAIClient();

  try {
    // Validate and sanitize inputs
    const sanitizedPrompt = prompt.trim();
    if (!sanitizedPrompt) {
      throw new Error('Prompt cannot be empty');
    }

    // Ensure we use a compatible size for the model
    let compatibleSize = size;
    if (model === 'dall-e-2' && !['256x256', '512x512', '1024x1024'].includes(size)) {
      compatibleSize = '1024x1024'; // DALL-E 2 fallback
    }

    console.log(
      `Attempting OpenAI image editing with model: ${model}, size: ${compatibleSize}, quality: ${quality}`,
    );

    // For gpt-image-1, we can use the new image editing API
    if (model === 'gpt-image-1') {
      // Convert buffer to File object
      const imageFile = new File([new Uint8Array(imageBuffer)], 'image.png', { type: 'image/png' });

      const response = await openai.images.edit({
        model: 'gpt-image-1',
        image: imageFile,
        prompt: sanitizedPrompt,
        n: Math.min(n, 10),
        size: compatibleSize as '256x256' | '512x512' | '1024x1024' | '1024x1536' | '1536x1024',
        quality:
          quality === 'hd'
            ? 'high'
            : quality === 'standard'
              ? 'medium'
              : (quality as 'low' | 'medium' | 'high'),
      });

      const images: string[] = [];
      for (const item of response.data || []) {
        const responseItem = item as {
          b64_json?: string | null;
          data?: string | null;
        };

        if (responseItem.b64_json) {
          images.push(`data:image/png;base64,${responseItem.b64_json}`);
        } else if (responseItem.data) {
          images.push(`data:image/png;base64,${responseItem.data}`);
        }
      }

      if (images.length === 0) {
        throw new Error('No images returned from OpenAI image editing');
      }

      // Extract usage information if available
      const responseWithUsage = response as typeof response & {
        usage?: {
          total_tokens?: number;
          input_tokens?: number;
          output_tokens?: number;
          input_tokens_details?: {
            text_tokens?: number;
            image_tokens?: number;
          };
        };
      };

      return {
        images,
        usage: {
          total_tokens: responseWithUsage.usage?.total_tokens || sanitizedPrompt.length,
          input_tokens: responseWithUsage.usage?.input_tokens,
          output_tokens: responseWithUsage.usage?.output_tokens,
          input_tokens_details: responseWithUsage.usage?.input_tokens_details,
        },
        model,
        size: compatibleSize,
        quality,
      };
    } else if (model === 'dall-e-2') {
      // For DALL-E 2, use the traditional edit API
      console.log('Converting image to RGBA format for DALL-E 2');

      try {
        // Convert image to RGBA format as required by OpenAI
        const rgbaImageBuffer = await sharp(imageBuffer).ensureAlpha().png().toBuffer();

        console.log(
          `Image conversion complete. Original size: ${imageBuffer.length}, RGBA size: ${rgbaImageBuffer.length}`,
        );

        const imageFile = new File([new Uint8Array(rgbaImageBuffer)], 'image.png', {
          type: 'image/png',
        });

        console.log(
          `Attempting OpenAI image editing with model: ${model}, size: ${compatibleSize}`,
        );

        const response = await openai.images.edit({
          model: 'dall-e-2',
          image: imageFile,
          prompt: sanitizedPrompt,
          n: Math.min(n, 10),
          size: compatibleSize as '256x256' | '512x512' | '1024x1024',
          response_format: 'b64_json',
        });

        const images: string[] = [];
        for (const item of response.data || []) {
          const responseItem = item as {
            b64_json?: string | null;
          };

          if (responseItem.b64_json) {
            images.push(`data:image/png;base64,${responseItem.b64_json}`);
          }
        }

        if (images.length === 0) {
          throw new Error('No images returned from DALL-E 2 image editing');
        }

        return {
          images,
          usage: {
            total_tokens: sanitizedPrompt.length,
          },
          model,
          size: compatibleSize,
          quality,
        };
      } catch (sharpError) {
        console.error('Image conversion error:', sharpError);
        throw new Error(
          `Failed to convert image to RGBA format: ${sharpError instanceof Error ? sharpError.message : 'Unknown error'}`,
        );
      }
    } else {
      throw new Error(`Model ${model} does not support image editing`);
    }
  } catch (error: unknown) {
    console.error('OpenAI image editing error:', error);

    // Detailed error handling
    let errorMessage = 'Unknown error';

    if (error && typeof error === 'object') {
      const err = error as Record<string, unknown>;

      if (err.error && typeof err.error === 'object') {
        const innerErr = err.error as Record<string, unknown>;
        if (typeof innerErr.message === 'string') {
          errorMessage = innerErr.message;
        }
      } else if (typeof err.message === 'string') {
        errorMessage = err.message;
      } else if (typeof err.type === 'string') {
        switch (err.type) {
          case 'image_generation_user_error':
            errorMessage =
              'Unable to edit image. This may be due to content policy restrictions, billing limits, or account configuration.';
            break;
          case 'invalid_request_error':
            errorMessage = 'Invalid request format for image editing.';
            break;
          case 'rate_limit_exceeded':
            errorMessage = 'Rate limit exceeded. Please try again later.';
            break;
          case 'insufficient_quota':
            errorMessage = 'Insufficient quota. Please check your OpenAI billing.';
            break;
          default:
            errorMessage = `OpenAI error: ${err.type}`;
        }
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    throw new Error(`OpenAI image editing failed: ${errorMessage}`);
  }
}
