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
  const response = await fetch("/api/generate", {
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
  const providers: Provider[] = ["openai", "stability", "replicate", "google"];

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
  openai: [
    {
      id: "dall-e-3",
      name: "DALL-E 3",
      description: "Latest and most capable model",
    },
    {
      id: "dall-e-2",
      name: "DALL-E 2",
      description: "Previous generation, faster",
    },
  ],
  stability: [
    {
      id: "stable-diffusion-xl-1024-v1-0",
      name: "SDXL 1.0",
      description: "High quality, latest version",
    },
    {
      id: "stable-diffusion-v1-6",
      name: "SD 1.6",
      description: "Fast and reliable",
    },
  ],
  replicate: [
    {
      id: "sdxl",
      name: "Stable Diffusion XL",
      description: "Open source, customizable",
    },
  ],
  google: [
    {
      id: "imagen-4.0-generate-preview-06-06",
      name: "Imagen 4.0 (Latest Preview)",
      description: "Latest preview version with improved quality",
    },
    {
      id: "imagen-4.0-fast-generate-preview-06-06",
      name: "Imagen 4.0 Fast (Preview)",
      description: "Faster generation with good quality",
    },
    {
      id: "imagen-4.0-ultra-generate-preview-06-06",
      name: "Imagen 4.0 Ultra (Preview)",
      description: "Highest quality, slower generation",
    },
    {
      id: "imagen-3.0-generate-002",
      name: "Imagen 3.0",
      description: "Stable version with reliable performance",
    },
    {
      id: "imagen-3.0-generate-001",
      name: "Imagen 3.0 (v001)",
      description: "Previous stable version",
    },
    {
      id: "imagen-3.0-fast-generate-001",
      name: "Imagen 3.0 Fast",
      description: "Faster generation with good quality",
    },
    {
      id: "imagen-3.0-capability-001",
      name: "Imagen 3.0 Capability",
      description: "Enhanced capabilities model",
    },
    {
      id: "imagegeneration@006",
      name: "Image Generation v006",
      description: "Legacy model v006",
    },
    {
      id: "imagegeneration@005",
      name: "Image Generation v005",
      description: "Legacy model v005",
    },
    {
      id: "imagegeneration@002",
      name: "Image Generation v002",
      description: "Legacy model v002",
    },
  ],
} as const;
