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
};

export function getEnabledProviders(): ProviderConfig[] {
  return Object.values(providerConfigs).filter((config) => config.enabled);
}

export function isProviderEnabled(provider: string): boolean {
  return providerConfigs[provider]?.enabled ?? false;
}
