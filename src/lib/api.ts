import { AVAILABLE_PROVIDERS, getProviderModels } from "@/config/providers";

export type Provider = "openai" | "stability" | "replicate" | "google";

export interface GenerateImageParams {
  prompt: string;
  provider?: Provider;
  model?: string;
  width?: number;
  height?: number;
  steps?: number;
}

export interface GenerateImageResponse {
  success: boolean;
  provider: Provider;
  model: string;
  images: string[];
  usage?: {
    total_tokens?: number;
    credits_consumed?: number;
    prediction_id?: string;
  };
  error?: string;
  details?: string;
}

export async function generateImage(
  params: GenerateImageParams
): Promise<GenerateImageResponse> {
  const response = await fetch(`${process.env.NEXTAUTH_URL}/api/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error || `HTTP ${response.status}: ${response.statusText}`
    );
  }

  return data;
}

// Smart routing function that automatically selects the best provider
export async function generateImageSmart(
  prompt: string
): Promise<GenerateImageResponse> {
  // Simple routing logic - you can make this more sophisticated
  const providers: Provider[] = AVAILABLE_PROVIDERS;

  for (const provider of providers) {
    try {
      return await generateImage({ prompt, provider });
    } catch (error) {
      console.warn(`Provider ${provider} failed:`, error);
      // Continue to next provider
    }
  }

  throw new Error("All providers failed");
}

// Utility to get available models for each provider
export const providerModels = {
  openai: getProviderModels("openai"),
  stability: getProviderModels("stability"),
  replicate: getProviderModels("replicate"),
  google: getProviderModels("google"),
} as const;
