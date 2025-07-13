// Credit pricing and cost configuration

export const CREDIT_PACKAGES = [
  {
    id: 'starter',
    name: 'Starter Pack',
    credits: 100,
    price: 999, // $9.99 in cents
    popular: false,
    description: 'Perfect for getting started',
    bonus: 0,
  },
  {
    id: 'popular',
    name: 'Popular Pack',
    credits: 500,
    price: 3999, // $39.99 in cents
    popular: true,
    description: 'Great value for regular use',
    bonus: 50, // Bonus credits
  },
  {
    id: 'pro',
    name: 'Pro Pack',
    credits: 1000,
    price: 6999, // $69.99 in cents
    popular: false,
    description: 'For power users',
    bonus: 150, // Bonus credits
  },
  {
    id: 'enterprise',
    name: 'Enterprise Pack',
    credits: 5000,
    price: 29999, // $299.99 in cents
    popular: false,
    description: 'For teams and businesses',
    bonus: 1000, // Bonus credits
  },
] as const;

// Cost per image generation by provider and settings (in cents)
export const GENERATION_COSTS = {
  openai: {
    'dall-e-2': {
      '256x256': 1.6, // $0.016
      '512x512': 1.8, // $0.018
      '1024x1024': 2.0, // $0.02
    },
    'dall-e-3': {
      '1024x1024': 4.0, // $0.04
      '1792x1024': 8.0, // $0.08
      '1024x1792': 8.0, // $0.08
    },
    'gpt-image-1': {
      '1024x1024': 1.1, // $0.011 (low quality)
      '1024x1536': 1.6, // $0.016 (low quality)
      '1536x1024': 1.6, // $0.016 (low quality)
    },
  },
  stability: {
    'stable-diffusion-xl-1024-v1-0': 3,
    'stable-diffusion-v1-6': 2,
    default: 3,
  },
  replicate: {
    default: 2,
  },
  google: {
    'imagen-4-preview': 4.0, // $0.04
    'imagen-4-standard': 4.0, // $0.04
    'imagen-4-ultra': 6.0, // $0.06
    'imagen-3': 3.0, // $0.03
    default: 4.0,
  },
} as const;

// GPT-Image-1 token costs (per 1M tokens in USD)
export const GPT_IMAGE_TOKEN_COSTS = {
  input: 10.0, // $10.00 per 1M tokens
  cached_input: 2.5, // $2.50 per 1M tokens
  output: 40.0, // $40.00 per 1M tokens
} as const;

// Calculate cost for image generation
export function calculateGenerationCost(
  provider: keyof typeof GENERATION_COSTS,
  model?: string,
  size?: string,
  quality?: string
): number {
  const providerCosts = GENERATION_COSTS[provider];

  if (!providerCosts) {
    return 1; // Default cost
  }

  if (provider === 'openai' && model && size) {
    const openaiCosts = providerCosts as typeof GENERATION_COSTS.openai;
    if (model in openaiCosts) {
      const modelCosts = openaiCosts[model as keyof typeof openaiCosts];
      if (typeof modelCosts === 'object' && size in modelCosts) {
        let baseCost = modelCosts[size as keyof typeof modelCosts] || 3;

        // Apply quality multipliers for specific models
        if (model === 'gpt-image-1' && quality) {
          switch (quality) {
            case 'medium':
              baseCost *= 3.8; // $0.042 / $0.011
              break;
            case 'high':
              baseCost *= 15.2; // $0.167 / $0.011
              break;
            // low quality uses base cost
          }
        }

        if (model === 'dall-e-3' && quality === 'hd') {
          baseCost *= 2; // HD costs double
        }

        return baseCost;
      }
    }
  }

  if (provider === 'google' && model) {
    const googleCosts = providerCosts as typeof GENERATION_COSTS.google;
    if (model in googleCosts) {
      return googleCosts[model as keyof typeof googleCosts];
    }
  }

  if (typeof providerCosts === 'object' && 'default' in providerCosts) {
    return providerCosts.default;
  }

  if (typeof providerCosts === 'number') {
    return providerCosts;
  }

  return 1; // Fallback
}

// Calculate token cost for GPT-Image-1
export function calculateGPTImageTokenCost(
  inputTokens: number,
  outputTokens: number,
  cachedInputTokens: number = 0
): number {
  const inputCost =
    ((inputTokens - cachedInputTokens) * GPT_IMAGE_TOKEN_COSTS.input) / 1000000;
  const cachedCost =
    (cachedInputTokens * GPT_IMAGE_TOKEN_COSTS.cached_input) / 1000000;
  const outputCost = (outputTokens * GPT_IMAGE_TOKEN_COSTS.output) / 1000000;

  return inputCost + cachedCost + outputCost;
}

// Calculate total cost for GPT-Image-1 generation (image + tokens)
export function calculateGPTImageTotalCost(
  size: string,
  quality: string,
  usage?: {
    total_tokens: number;
    input_tokens: number;
    output_tokens: number;
    input_tokens_details?: {
      text_tokens: number;
      image_tokens: number;
    };
  }
): number {
  // Image generation cost
  const imageCost = calculateGenerationCost('openai', 'gpt-image-1', size, quality);

  // Token cost (if usage data is provided)
  let tokenCost = 0;
  if (usage) {
    tokenCost = calculateGPTImageTokenCost(
      usage.input_tokens,
      usage.output_tokens
    );
  }

  return imageCost + tokenCost;
}

// Free tier limits
export const FREE_TIER_LIMITS = {
  dailyCredits: 5,
  monthlyCredits: 50,
  maxResolution: '1024x1024',
  allowedProviders: ['openai', 'stability'],
} as const;

// Auto top-up options
export const AUTO_TOPUP_OPTIONS = [
  { credits: 50, price: 499 },
  { credits: 100, price: 999 },
  { credits: 200, price: 1799 },
  { credits: 500, price: 3999 },
] as const;
