import OpenAI from "openai";

let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OpenAI API key not configured");
    }
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
}

export interface OpenAIGenerateParams {
  prompt: string;
  model?: "gpt-image-1" | "dall-e-2" | "dall-e-3";
  size?: "256x256" | "512x512" | "1024x1024" | "1792x1024" | "1024x1792";
  quality?: "standard" | "hd";
  n?: number;
}

export interface OpenAIGenerateResponse {
  images: string[];
  usage?: {
    total_tokens?: number;
  };
}

export async function generateWithOpenAI(
  params: OpenAIGenerateParams
): Promise<OpenAIGenerateResponse> {
  const {
    prompt,
    model = "dall-e-2", // Default to DALL-E 2 for better compatibility
    size = "1024x1024",
    quality = "standard",
    n = 1,
  } = params;

  const openai = getOpenAIClient();

  try {
    // Validate and sanitize inputs
    const sanitizedPrompt = prompt.trim();
    if (!sanitizedPrompt) {
      throw new Error("Prompt cannot be empty");
    }

    // Ensure we use a compatible size for the model
    let compatibleSize = size;
    if (
      model === "dall-e-2" &&
      !["256x256", "512x512", "1024x1024"].includes(size)
    ) {
      compatibleSize = "1024x1024"; // DALL-E 2 fallback
    }

    console.log(
      `Attempting OpenAI generation with model: ${model}, size: ${compatibleSize}`
    );

    // Build request parameters based on model
    const baseParams = {
      model: model as "gpt-image-1" | "dall-e-2" | "dall-e-3",
      prompt: sanitizedPrompt,
      size: compatibleSize as
        | "256x256"
        | "512x512"
        | "1024x1024"
        | "1792x1024"
        | "1024x1792",
    };

    type RequestParams =
      | {
          model: "gpt-image-1";
          prompt: string;
          size: "256x256" | "512x512" | "1024x1024" | "1792x1024" | "1024x1792";
          n?: number;
        }
      | {
          model: "dall-e-2" | "dall-e-3";
          prompt: string;
          size: "256x256" | "512x512" | "1024x1024" | "1792x1024" | "1024x1792";
          response_format: "b64_json";
          quality?: "standard" | "hd";
          n?: number;
        };

    let requestParams: RequestParams;

    // Model-specific parameters
    if (model === "gpt-image-1") {
      // GPT Image 1 doesn't support response_format and always returns base64
      requestParams = {
        ...baseParams,
        model: "gpt-image-1",
        n: Math.min(n, 10), // GPT Image 1 supports up to 10 images
      };
    } else if (model === "dall-e-3") {
      // DALL-E 3 parameters
      requestParams = {
        ...baseParams,
        model: "dall-e-3",
        response_format: "b64_json", // Request base64 data instead of URLs
        quality: quality as "standard" | "hd",
        n: 1, // DALL-E 3 only supports n=1
      };
    } else {
      // DALL-E 2 parameters
      requestParams = {
        ...baseParams,
        model: "dall-e-2",
        response_format: "b64_json", // Request base64 data instead of URLs
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

      if (model === "gpt-image-1") {
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
      throw new Error("No images returned from OpenAI");
    }

    return {
      images,
      usage: {
        total_tokens: sanitizedPrompt.length, // Rough estimate
      },
    };
  } catch (error: unknown) {
    console.error("OpenAI generation error:", error);

    // If DALL-E 3 fails and we haven't tried DALL-E 2 yet, try DALL-E 2
    if (model === "dall-e-3") {
      console.log("DALL-E 3 failed, trying DALL-E 2 as fallback...");
      try {
        return await generateWithOpenAI({
          ...params,
          model: "dall-e-2",
          size: "1024x1024", // Ensure compatible size
        });
      } catch (fallbackError) {
        console.error("DALL-E 2 fallback also failed:", fallbackError);
      }
    }

    // More detailed error handling
    let errorMessage = "Unknown error";

    if (error && typeof error === "object") {
      const err = error as Record<string, unknown>;

      if (err.error && typeof err.error === "object") {
        const innerErr = err.error as Record<string, unknown>;
        if (typeof innerErr.message === "string") {
          errorMessage = innerErr.message;
        }
      } else if (typeof err.message === "string") {
        errorMessage = err.message;
      } else if (typeof err.type === "string") {
        switch (err.type) {
          case "image_generation_user_error":
            errorMessage =
              "Unable to generate image. This may be due to content policy restrictions, billing limits, or account configuration. Please check your OpenAI account status and try a different prompt.";
            break;
          case "invalid_request_error":
            errorMessage = "Invalid request format.";
            break;
          case "rate_limit_exceeded":
            errorMessage = "Rate limit exceeded. Please try again later.";
            break;
          case "insufficient_quota":
            errorMessage =
              "Insufficient quota. Please check your OpenAI billing.";
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
