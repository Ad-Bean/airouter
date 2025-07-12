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

// Cost per image generation by provider and settings
export const GENERATION_COSTS = {
  openai: {
    'dall-e-2': {
      '256x256': 1,
      '512x512': 2,
      '1024x1024': 3,
    },
    'dall-e-3': {
      '1024x1024': 5,
      '1792x1024': 8,
      '1024x1792': 8,
    },
    'gpt-image-1': {
      '1024x1024': 4,
      '1792x1024': 6,
      '1024x1792': 6,
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
    'imagen-4.0-generate-preview-06-06': 4,
    default: 4,
  },
} as const;

// Calculate cost for image generation
export function calculateGenerationCost(
  provider: keyof typeof GENERATION_COSTS,
  model?: string,
  size?: string
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
        return modelCosts[size as keyof typeof modelCosts] || 3;
      }
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
