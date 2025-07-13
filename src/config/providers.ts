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
        description: "Latest and most capable model ($0.04-$0.12/image)",
        supportsImageCount: true,
        maxImages: 1,
        defaultImages: 1,
      },
      {
        id: "dall-e-2",
        name: "DALL-E 2",
        description: "Faster and more reliable ($0.016-$0.02/image)",
        supportsImageCount: true,
        maxImages: 10,
        defaultImages: 1,
      },
      {
        id: "gpt-image-1",
        name: "GPT Image 1",
        description: "OpenAI's latest with token-based pricing ($0.011-$0.25/image + tokens)",
        supportsImageCount: true,
        maxImages: 10,
        defaultImages: 1,
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
        id: "imagen-4-preview",
        name: "Imagen 4 Preview",
        description: "Latest preview version with improved quality ($0.04/image)",
        supportsImageCount: true,
        maxImages: 8,
        defaultImages: 1,
      },
      {
        id: "imagen-4-standard",
        name: "Imagen 4 Standard",
        description: "Standard quality generation ($0.04/image)",
        supportsImageCount: true,
        maxImages: 8,
        defaultImages: 1,
      },
      {
        id: "imagen-4-ultra",
        name: "Imagen 4 Ultra",
        description: "Highest quality, premium tier ($0.06/image)",
        supportsImageCount: true,
        maxImages: 8,
        defaultImages: 1,
      },
      {
        id: "imagen-3",
        name: "Imagen 3",
        description: "Stable version with reliable performance ($0.03/image)",
        supportsImageCount: true,
        maxImages: 8,
        defaultImages: 1,
      },
      {
        id: "imagen-4.0-generate-preview-06-06",
        name: "Imagen 4.0 (Legacy)",
        description: "Legacy model name (maps to Preview)",
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
  google: "imagen-4-preview", // Default to Imagen 4 Preview
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
