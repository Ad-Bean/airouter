import { GoogleAuth } from 'google-auth-library';

export interface GoogleGenerateParams {
  prompt: string;
  model?:
    | 'imagen-4-preview'
    | 'imagen-4-standard'
    | 'imagen-4-ultra'
    | 'imagen-4-fast'
    | 'imagen-3'
    | 'imagen-3-fast'
    | 'imagen-4.0-generate-preview-06-06'
    | 'gemini-2.0-flash-preview-image-generation';
  sampleCount?: number;
  aspectRatio?: string;
  safetySetting?: string;
  personGeneration?: string;
  addWatermark?: boolean;
  seed?: number;
  enhancePrompt?: boolean;
}

export interface GoogleGenerateResponse {
  images: string[];
  usage?: {
    prediction_id?: string;
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
  };
  model?: string;
}

export interface GoogleEditParams {
  imageBuffer: Buffer;
  prompt: string;
  model?: 'gemini-2.0-flash-preview-image-generation';
  sampleCount?: number;
  aspectRatio?: string;
  safetySetting?: string;
  personGeneration?: string;
  addWatermark?: boolean;
  seed?: number;
  enhancePrompt?: boolean;
}

export interface GoogleEditResponse {
  images: string[];
  usage?: {
    prediction_id?: string;
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
  };
  model?: string;
}

let auth: GoogleAuth | null = null;

function getGoogleAuth(): GoogleAuth {
  if (!auth) {
    if (!process.env.GOOGLE_CLOUD_PROJECT) {
      throw new Error('GOOGLE_CLOUD_PROJECT environment variable not set');
    }
    if (!process.env.GOOGLE_CLOUD_LOCATION) {
      throw new Error('GOOGLE_CLOUD_LOCATION environment variable not set');
    }

    const authOptions: {
      scopes: string[];
      credentials?: Record<string, unknown>;
    } = {
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    };

    if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
      try {
        authOptions.credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
      } catch {
        throw new Error('Invalid GOOGLE_APPLICATION_CREDENTIALS_JSON format');
      }
    }
    // If GOOGLE_APPLICATION_CREDENTIALS is set, GoogleAuth will use it automatically
    // If running in Google Cloud, it will use the default service account

    auth = new GoogleAuth(authOptions);
  }
  return auth;
}

export async function generateWithGoogle(
  params: GoogleGenerateParams,
): Promise<GoogleGenerateResponse> {
  const {
    prompt,
    model = 'imagen-4-preview',
    sampleCount = 1,
    aspectRatio = '1:1',
    safetySetting = 'block_medium_and_above',
    personGeneration = 'allow_adult',
    addWatermark = true,
    seed,
    enhancePrompt = false,
  } = params;

  try {
    // Check if this is a Gemini model that needs different API handling
    if (model === 'gemini-2.0-flash-preview-image-generation') {
      // Use Gemini API directly with API key
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('GEMINI_API_KEY environment variable not set');
      }

      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

      const requestBody = {
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          responseModalities: ['TEXT', 'IMAGE'],
        },
      };

      console.log('Google Gemini API request:', JSON.stringify(requestBody, null, 2));

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'x-goog-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();

      console.log('Google Gemini API response:', JSON.stringify(result, null, 2));

      // Extract images from response
      const images: string[] = [];

      if (result.candidates && result.candidates.length > 0) {
        for (const candidate of result.candidates) {
          if (candidate.content && candidate.content.parts) {
            for (const part of candidate.content.parts) {
              if (part.inlineData && part.inlineData.data) {
                const mimeType = part.inlineData.mimeType || 'image/png';
                images.push(`data:${mimeType};base64,${part.inlineData.data}`);
              }
            }
          }
        }
      }

      if (images.length === 0) {
        console.error(
          'No images found in Google Gemini API response:',
          JSON.stringify(result, null, 2),
        );
        throw new Error('No images returned from Gemini API');
      }

      console.log(`Successfully extracted ${images.length} images from Google Gemini API`);

      return {
        images,
        usage: {
          prediction_id: result.metadata?.prediction_id,
          // Extract usage metadata from Gemini API response
          promptTokenCount: result.usageMetadata?.promptTokenCount,
          candidatesTokenCount: result.usageMetadata?.candidatesTokenCount,
          totalTokenCount: result.usageMetadata?.totalTokenCount,
          promptTokensDetails: result.usageMetadata?.promptTokensDetails,
          candidatesTokensDetails: result.usageMetadata?.candidatesTokensDetails,
        },
        model,
      };
    }

    // For non-Gemini models, use the existing Vertex AI logic
    const googleAuth = getGoogleAuth();
    const accessToken = await googleAuth.getAccessToken();

    if (!accessToken) {
      throw new Error('Failed to get Google Cloud access token');
    }

    const project = process.env.GOOGLE_CLOUD_PROJECT;
    const location = process.env.GOOGLE_CLOUD_LOCATION;

    // Map model names to API endpoints
    const modelEndpoints: Record<string, string> = {
      'imagen-4-preview': 'imagen-4.0-generate-preview-06-06',
      'imagen-4-standard': 'imagen-4.0-generate-standard-06-06',
      'imagen-4-ultra': 'imagen-4.0-generate-ultra-06-06',
      'imagen-4-fast': 'imagen-4.0-fast-generate-preview-06-06',
      'imagen-3': 'imagen-3.0-generate-001',
      'imagen-3-fast': 'imagen-3.0-fast-generate-001',
      'imagen-4.0-generate-preview-06-06': 'imagen-4.0-generate-preview-06-06', // Legacy support
    };

    const apiModel = modelEndpoints[model] || model;
    const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${project}/locations/${location}/publishers/google/models/${apiModel}:predict`;

    const requestBody = {
      instances: [
        {
          prompt: prompt,
        },
      ],
      parameters: {
        sampleCount: sampleCount,
        aspectRatio: aspectRatio,
        safetySetting: safetySetting,
        personGeneration: personGeneration,
        addWatermark: addWatermark,
        ...(seed !== undefined && { seed }),
        enhancePrompt: enhancePrompt,
      },
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google Vertex AI API Error Details:', {
        status: response.status,
        statusText: response.statusText,
        errorBody: errorText,
        endpoint,
        requestBody,
      });
      throw new Error(
        `Google Vertex AI API error: ${response.status} ${response.statusText}\n${errorText}`,
      );
    }

    const data = await response.json();

    console.log('\n\nGoogle Vertex AI response:', data);

    if (!data.predictions || !Array.isArray(data.predictions)) {
      throw new Error('Invalid response format from Google Vertex AI API');
    }

    // Extract images from the response
    const images: string[] = [];
    let errorMessage = null;

    for (const prediction of data.predictions) {
      if (prediction.bytesBase64Encoded) {
        // Convert base64 to data URL
        images.push(`data:image/png;base64,${prediction.bytesBase64Encoded}`);
      } else if (prediction.raiFilteredReason) {
        // Handle content filtered by Google's Responsible AI
        errorMessage = prediction.raiFilteredReason;
      }
    }

    if (images.length === 0) {
      if (errorMessage) {
        throw new Error(`Google Vertex AI filtered the content: ${errorMessage}`);
      } else {
        throw new Error('No images generated by Google Vertex AI');
      }
    }

    return {
      images,
      usage: {
        prediction_id: data.metadata?.predictionId,
      },
      model,
    };
  } catch (error) {
    console.error('Google Vertex AI generation error:', error);
    throw error;
  }
}

export async function editImageWithGoogle(params: GoogleEditParams): Promise<GoogleEditResponse> {
  const { imageBuffer, prompt, model = 'gemini-2.0-flash-preview-image-generation' } = params;

  // Check if model supports image editing
  if (model !== 'gemini-2.0-flash-preview-image-generation') {
    throw new Error(
      `Model ${model} does not support image editing. Only 'gemini-2.0-flash-preview-image-generation' supports image editing.`,
    );
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable not set');
    }

    const imageBase64 = imageBuffer.toString('base64');

    // Check if image is valid
    if (!imageBase64 || imageBase64.length === 0) {
      throw new Error('Invalid image data: empty base64 string');
    }

    // Check image size (Google has limits)
    const imageSizeBytes = imageBuffer.length;
    const maxSizeBytes = 20 * 1024 * 1024; // 20MB limit
    if (imageSizeBytes > maxSizeBytes) {
      throw new Error(
        `Image too large: ${imageSizeBytes} bytes exceeds ${maxSizeBytes} bytes limit`,
      );
    }

    console.log('Image validation passed:', {
      imageSizeBytes,
      base64Length: imageBase64.length,
    });

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

    // Detect image format from buffer
    let mimeType = 'image/jpeg';
    if (imageBuffer[0] === 0xff && imageBuffer[1] === 0xd8) {
      mimeType = 'image/jpeg';
    } else if (
      imageBuffer[0] === 0x89 &&
      imageBuffer[1] === 0x50 &&
      imageBuffer[2] === 0x4e &&
      imageBuffer[3] === 0x47
    ) {
      mimeType = 'image/png';
    } else if (imageBuffer[0] === 0x47 && imageBuffer[1] === 0x49 && imageBuffer[2] === 0x46) {
      mimeType = 'image/gif';
    } else if (
      imageBuffer[0] === 0x57 &&
      imageBuffer[1] === 0x45 &&
      imageBuffer[2] === 0x42 &&
      imageBuffer[3] === 0x50
    ) {
      mimeType = 'image/webp';
    }

    const requestBody = {
      contents: [
        {
          parts: [
            {
              inline_data: {
                mime_type: mimeType,
                data: imageBase64,
              },
            },
            {
              text: `Please modify this image: ${prompt}`,
            },
          ],
        },
      ],
      generationConfig: {
        responseModalities: ['TEXT', 'IMAGE'],
        candidateCount: 1,
      },
    };

    console.log('Making Google API request for image editing:', {
      endpoint,
      model,
      promptLength: prompt.length,
      imageBase64Length: imageBase64.length,
    });

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'x-goog-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google API HTTP error:', response.status, errorText);
      throw new Error(`Google API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('Google API response:', JSON.stringify(result, null, 2));

    // More comprehensive image extraction logic
    const extractImagesFromResponse = (response: Record<string, unknown>): string[] => {
      const images: string[] = [];

      console.log('Extracting images from response...');

      if (!response.candidates || !Array.isArray(response.candidates)) {
        console.log('No candidates found in response');
        return images;
      }

      for (const candidate of response.candidates) {
        console.log('Processing candidate:', candidate);

        // Check finish reason
        if (candidate.finishReason && candidate.finishReason !== 'STOP') {
          console.log('Candidate finished with reason:', candidate.finishReason);
          if (candidate.finishReason === 'SAFETY') {
            throw new Error("Content was blocked by Google's safety filters");
          }
        }

        if (!candidate.content || !candidate.content.parts) {
          console.log('No content.parts found in candidate');
          continue;
        }

        for (const part of candidate.content.parts) {
          console.log('Processing part:', part);

          // Check for inline_data
          if (part.inline_data && part.inline_data.data) {
            const mimeType = part.inline_data.mime_type || 'image/png';
            const imageData = `data:${mimeType};base64,${part.inline_data.data}`;
            images.push(imageData);
            console.log('Found image via inline_data:', {
              mimeType,
              dataLength: part.inline_data.data.length,
            });
          }
          // Check for inlineData (camelCase)
          else if (part.inlineData && part.inlineData.data) {
            const mimeType = part.inlineData.mimeType || part.inlineData.mime_type || 'image/png';
            const imageData = `data:${mimeType};base64,${part.inlineData.data}`;
            images.push(imageData);
            console.log('Found image via inlineData:', {
              mimeType,
              dataLength: part.inlineData.data.length,
            });
          }
          // Check for direct data field
          else if (part.data && typeof part.data === 'string') {
            const mimeType = part.mimeType || part.mime_type || 'image/png';
            const imageData = `data:${mimeType};base64,${part.data}`;
            images.push(imageData);
            console.log('Found image via direct data:', { mimeType, dataLength: part.data.length });
          }
          // Check for text content (sometimes images are embedded in text)
          else if (part.text && part.text.includes('base64,')) {
            const base64Match = part.text.match(/data:([^;]+);base64,([^"'\s]+)/);
            if (base64Match) {
              images.push(base64Match[0]);
              console.log('Found image embedded in text:', {
                mimeType: base64Match[1],
                dataLength: base64Match[2].length,
              });
            }
          }
        }
      }

      return images;
    };

    // Extract images from response
    const images = extractImagesFromResponse(result);

    console.log('Final extracted images count:', images.length);

    if (images.length === 0) {
      // Log the full response for debugging
      console.error('No images found in Google API response:', JSON.stringify(result, null, 2));

      // Check if there are any specific error messages
      if (result.error) {
        throw new Error(
          `Google API error: ${result.error.message || result.error.code || 'Unknown error'}`,
        );
      }

      // Check if the model supports image editing
      if (model !== 'gemini-2.0-flash-preview-image-generation') {
        throw new Error(
          `Model ${model} may not support image editing. Please use 'gemini-2.0-flash-preview-image-generation'`,
        );
      }

      // Check if the request was blocked
      if (result.candidates && result.candidates.length > 0) {
        const candidate = result.candidates[0];
        if (candidate.finishReason === 'SAFETY' || candidate.finishReason === 'BLOCKED_REASON') {
          throw new Error(
            'Google API blocked the request due to safety concerns. Try a different prompt or image.',
          );
        }
      }

      // Check if there might be a quota or rate limit issue
      if (result.quota_exceeded || result.rate_limit_exceeded) {
        throw new Error('Google API quota or rate limit exceeded. Please try again later.');
      }

      throw new Error(
        'No images returned from Google image editing. The model may not have generated an image due to content policies, technical issues, or the prompt may not be suitable for image editing.',
      );
    }

    return {
      images,
      usage: {
        prediction_id: result.metadata?.prediction_id,
        // Extract usage metadata from Gemini API response
        promptTokenCount: result.usageMetadata?.promptTokenCount,
        candidatesTokenCount: result.usageMetadata?.candidatesTokenCount,
        totalTokenCount: result.usageMetadata?.totalTokenCount,
        promptTokensDetails: result.usageMetadata?.promptTokensDetails,
        candidatesTokensDetails: result.usageMetadata?.candidatesTokensDetails,
      },
      model,
    };
  } catch (error: unknown) {
    console.error('Google image editing error:', error);

    let errorMessage = 'Unknown error';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }

    throw new Error(`Google image editing failed: ${errorMessage}`);
  }
}
