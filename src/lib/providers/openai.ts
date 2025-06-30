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
  model?: "dall-e-2" | "dall-e-3";
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
    const requestParams: {
      model: "dall-e-2" | "dall-e-3";
      prompt: string;
      size: "256x256" | "512x512" | "1024x1024" | "1792x1024" | "1024x1792";
      response_format: "b64_json";
      quality?: "standard" | "hd";
      n?: number;
    } = {
      model: model as "dall-e-2" | "dall-e-3",
      prompt: sanitizedPrompt,
      size: compatibleSize as
        | "256x256"
        | "512x512"
        | "1024x1024"
        | "1792x1024"
        | "1024x1792",
      response_format: "b64_json", // Request base64 data instead of URLs
    };

    // DALL-E 3 specific parameters
    if (model === "dall-e-3") {
      requestParams.quality = quality as "standard" | "hd";
      requestParams.n = 1; // DALL-E 3 only supports n=1
    } else {
      // DALL-E 2 parameters
      requestParams.n = Math.min(n, 10); // DALL-E 2 supports up to 10 images
    }

    const response = await openai.images.generate(requestParams);

    const images = (response.data || [])
      .map((item: { b64_json?: string | null }) => item.b64_json)
      .filter((base64): base64 is string => Boolean(base64))
      .map((base64) => `data:image/png;base64,${base64}`); // Convert to data URL format

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
