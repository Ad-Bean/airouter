import { type Provider } from "@/lib/api";

// Model configuration interface
export interface ModelConfig {
  id: string;
  name: string;
  description: string;
  supportsImageCount?: boolean;
  maxImages?: number;
  defaultImages?: number;
}

// Provider configuration interface
export interface ProviderConfig {
  name: Provider;
  displayName: string;
  shortDescription: string;
  iconName: string;
  color: string;
  badgeColor: string;
  enabled: boolean;
  models: ModelConfig[];
}

// Comprehensive provider configurations
export const PROVIDER_CONFIGS: Record<Provider, ProviderConfig> = {
  openai: {
    name: "openai",
    displayName: "OpenAI",
    shortDescription: "OpenAI Image Generation",
    iconName: "Wand2",
    color: "from-pink-500 to-rose-600",
    badgeColor: "bg-blue-500",
    enabled: !!process.env.OPENAI_API_KEY,
    models: [
      {
        id: "dall-e-3",
        name: "DALL-E 3",
        description: "Latest and most capable model",
        supportsImageCount: true,
        maxImages: 1,
        defaultImages: 1,
      },
      {
        id: "dall-e-2",
        name: "DALL-E 2",
        description: "Faster and more reliable",
        supportsImageCount: true,
        maxImages: 10,
        defaultImages: 1,
      },
      {
        id: "gpt-image-1",
        name: "GPT Image 1",
        description: "OpenAI's latest image generation model",
        supportsImageCount: true,
        maxImages: 10,
        defaultImages: 1,
      },
    ],
  },
  stability: {
    name: "stability",
    displayName: "Stability AI",
    shortDescription: "SDXL",
    iconName: "Sparkles",
    color: "from-teal-500 to-emerald-600",
    badgeColor: "bg-green-500",
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
    shortDescription: "SDXL",
    iconName: "Paintbrush",
    color: "from-violet-500 to-indigo-600",
    badgeColor: "bg-purple-500",
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
    shortDescription: "Imagen",
    iconName: "ImageIcon",
    color: "from-red-500 to-orange-600",
    badgeColor: "bg-red-500",
    enabled: !!(
      process.env.GOOGLE_CLOUD_PROJECT && process.env.GOOGLE_CLOUD_LOCATION
    ),
    models: [
      {
        id: "imagen-4.0-generate-preview-06-06",
        name: "Imagen 4.0 (Latest Preview)",
        description: "Latest preview version with improved quality",
        supportsImageCount: true,
        maxImages: 8,
        defaultImages: 1,
      },
      {
        id: "imagen-4.0-fast-generate-preview-06-06",
        name: "Imagen 4.0 Fast (Preview)",
        description: "Faster generation with good quality",
        supportsImageCount: true,
        maxImages: 8,
        defaultImages: 1,
      },
      {
        id: "imagen-4.0-ultra-generate-preview-06-06",
        name: "Imagen 4.0 Ultra (Preview)",
        description: "Highest quality, slower generation",
        supportsImageCount: true,
        maxImages: 8,
        defaultImages: 1,
      },
      {
        id: "imagen-3.0-generate-002",
        name: "Imagen 3.0",
        description: "Stable version with reliable performance",
        supportsImageCount: true,
        maxImages: 8,
        defaultImages: 1,
      },
      {
        id: "imagen-3.0-generate-001",
        name: "Imagen 3.0 (v001)",
        description: "Previous stable version",
        supportsImageCount: true,
        maxImages: 8,
        defaultImages: 1,
      },
      {
        id: "imagen-3.0-fast-generate-001",
        name: "Imagen 3.0 Fast",
        description: "Faster generation with good quality",
        supportsImageCount: true,
        maxImages: 8,
        defaultImages: 1,
      },
      {
        id: "imagen-3.0-capability-001",
        name: "Imagen 3.0 Capability",
        description: "Enhanced capabilities model",
        supportsImageCount: true,
        maxImages: 8,
        defaultImages: 1,
      },
      {
        id: "imagegeneration@006",
        name: "Image Generation v006",
        description: "Legacy model v006",
        supportsImageCount: true,
        maxImages: 8,
        defaultImages: 1,
      },
      {
        id: "imagegeneration@005",
        name: "Image Generation v005",
        description: "Legacy model v005",
        supportsImageCount: true,
        maxImages: 8,
        defaultImages: 1,
      },
      {
        id: "imagegeneration@002",
        name: "Image Generation v002",
        description: "Legacy model v002",
        supportsImageCount: true,
        maxImages: 8,
        defaultImages: 1,
      },
    ],
  },
};

// Available AI providers (derived from config)
export const AVAILABLE_PROVIDERS: Provider[] = Object.keys(
  PROVIDER_CONFIGS
) as Provider[];

// Provider display info (backward compatibility)
export const PROVIDER_INFO: Record<
  Provider,
  { displayName: string; description: string }
> = Object.fromEntries(
  AVAILABLE_PROVIDERS.map((provider) => [
    provider,
    {
      displayName: PROVIDER_CONFIGS[provider].displayName,
      description: PROVIDER_CONFIGS[provider].shortDescription,
    },
  ])
) as Record<Provider, { displayName: string; description: string }>;

// Default provider selection
export const DEFAULT_PROVIDERS: Provider[] = ["openai"];

// Default model configurations
export const DEFAULT_MODELS: Record<string, string> = {
  openai: "dall-e-2", // Default to DALL-E 2 for OpenAI
  google: "imagen-4.0-generate-preview-06-06",
};

// Helper functions
export function getEnabledProviders(): ProviderConfig[] {
  return AVAILABLE_PROVIDERS.map(
    (provider) => PROVIDER_CONFIGS[provider]
  ).filter((config) => config.enabled);
}

export function isProviderEnabled(provider: Provider): boolean {
  return PROVIDER_CONFIGS[provider]?.enabled ?? false;
}

export function getProviderModels(provider: Provider): ModelConfig[] {
  return PROVIDER_CONFIGS[provider]?.models ?? [];
}
