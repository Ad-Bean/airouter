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
    model = "dall-e-3",
    size = "1024x1024",
    quality = "standard",
    n = 1,
  } = params;

  const openai = getOpenAIClient();

  try {
    const response = await openai.images.generate({
      model,
      prompt,
      size,
      quality: model === "dall-e-3" ? quality : undefined,
      n,
      response_format: "url",
    });

    const images = (response.data || [])
      .map((item: { url?: string | null }) => item.url)
      .filter((url): url is string => Boolean(url));

    return {
      images,
      usage: {
        total_tokens: prompt.length, // Rough estimate
      },
    };
  } catch (error) {
    console.error("OpenAI generation error:", error);
    throw new Error(
      `OpenAI generation failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
