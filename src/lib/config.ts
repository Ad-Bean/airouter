export interface ProviderConfig {
  name: string;
  displayName: string;
  enabled: boolean;
  models: {
    id: string;
    name: string;
    description: string;
  }[];
}

export const providerConfigs: Record<string, ProviderConfig> = {
  openai: {
    name: "openai",
    displayName: "OpenAI DALL-E",
    enabled: !!process.env.OPENAI_API_KEY,
    models: [
      {
        id: "dall-e-2",
        name: "DALL-E 2",
        description: "Faster and more reliable",
      },
      {
        id: "dall-e-3",
        name: "DALL-E 3",
        description: "Latest and most capable model",
      },
    ],
  },
  stability: {
    name: "stability",
    displayName: "Stability AI",
    enabled: !!process.env.STABILITY_API_KEY,
    models: [
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
  },
  replicate: {
    name: "replicate",
    displayName: "Replicate (SDXL)",
    enabled: !!process.env.REPLICATE_API_TOKEN,
    models: [
      {
        id: "sdxl",
        name: "Stable Diffusion XL",
        description: "Open source, customizable",
      },
    ],
  },
  google: {
    name: "google",
    displayName: "Google Imagen",
    enabled: !!(
      process.env.GOOGLE_CLOUD_PROJECT && process.env.GOOGLE_CLOUD_LOCATION
    ),
    models: [
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
  },
};

export function getEnabledProviders(): ProviderConfig[] {
  return Object.values(providerConfigs).filter((config) => config.enabled);
}

export function isProviderEnabled(provider: string): boolean {
  return providerConfigs[provider]?.enabled ?? false;
}
