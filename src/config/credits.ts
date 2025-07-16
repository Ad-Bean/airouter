// Credit pricing and cost configuration

export const CREDIT_PACKAGES = [
  {
    id: 'starter-50',
    name: 'Starter Pack',
    credits: 50,
    price: 499, // $4.99 in cents (1 credit = $0.10)
    popular: false,
    description: 'Perfect for getting started',
    bonus: 0,
  },
  {
    id: 'starter-100',
    name: 'Popular Pack',
    credits: 100,
    price: 999, // $9.99 in cents
    popular: true,
    description: 'Great for regular use',
    bonus: 10,
  },
  {
    id: 'value-250',
    name: 'Value Pack',
    credits: 150,
    price: 1499, // $14.99 in cents (4% discount)
    popular: false,
    description: 'Best value for frequent users',
    bonus: 20, // Bonus credits
  },
  {
    id: 'pro-500',
    name: 'Pro Pack',
    credits: 500,
    price: 4599, // $45.99 in cents (10% discount)
    popular: false,
    description: 'For power users',
    bonus: 50, // Bonus credits
  },
  // {
  //   id: 'enterprise-1000',
  //   name: 'Enterprise Pack',
  //   credits: 1000,
  //   price: 8000, // $80.00 in cents (20% discount)
  //   popular: false,
  //   description: 'For teams and businesses',
  //   bonus: 200, // Bonus credits
  // },
] as const;

// Cost per image generation by provider and settings (in credits)
// Note: 1 credit = $0.10, so $0.04 = 0.4 credits
export const GENERATION_COSTS = {
  openai: {
    'dall-e-2': {
      '256x256': 0.16, // $0.016 = 0.16 credits
      '512x512': 0.18, // $0.018 = 0.18 credits
      '1024x1024': 0.2, // $0.02 = 0.20 credits
    },
    'dall-e-3': {
      '1024x1024': 0.4, // $0.04 = 0.40 credits
      '1792x1024': 0.8, // $0.08 = 0.80 credits
      '1024x1792': 0.8, // $0.08 = 0.80 credits
    },
    'gpt-image-1': {
      '1024x1024': 0.11, // $0.011 = 0.11 credits (low quality)
      '1024x1536': 0.16, // $0.016 = 0.16 credits (low quality)
      '1536x1024': 0.16, // $0.016 = 0.16 credits (low quality)
    },
  },
  google: {
    'imagen-4-preview': 0.4, // $0.04 = 0.40 credits
    'imagen-4-standard': 0.4, // $0.04 = 0.40 credits
    'imagen-4-ultra': 0.6, // $0.06 = 0.60 credits
    'imagen-4-fast': 0.2, // $0.02 = 0.20 credits
    'imagen-3': 0.4, // $0.04 = 0.40 credits
    'imagen-3-fast': 0.2, // $0.02 = 0.20 credits
    'gemini-2.0-flash-preview-image-generation': 0.4, // $0.04 = 0.40 credits
    'imagen-4.0-generate-preview-06-06': 0.4, // $0.04 = 0.40 credits (legacy mapping)
    default: 0.4,
  },
} as const;

// Image editing cost configuration
export const EDITING_COST_MULTIPLIER = 1.25; // Editing costs 1.25x more than generation
export const MINIMUM_EDITING_COST = 1; // Minimum 1 credit for any editing operation
export const MINIMUM_GENERATION_COST = 1; // Minimum 1 credit for any generation operation

// GPT-Image-1 token costs (per 1M tokens in USD, converted to credits)
export const GPT_IMAGE_TOKEN_COSTS = {
  text_input: 50.0, // $5.00 per 1M tokens = 50 credits per 1M tokens
  text_cached_input: 12.5, // $1.25 per 1M tokens = 12.5 credits per 1M tokens
  image_input: 100.0, // $10.00 per 1M tokens = 100 credits per 1M tokens
  image_cached_input: 25.0, // $2.50 per 1M tokens = 25 credits per 1M tokens
  image_output: 400.0, // $40.00 per 1M tokens = 400 credits per 1M tokens
} as const;

// Gemini 2.0 Flash token costs (per 1M tokens/characters in USD, converted to credits)
export const GEMINI_TOKEN_COSTS = {
  input_text: 375.0, // $37.50 per 1M characters = 375 credits per 1M chars
  input_image: 193.5, // $19.35 per 100 images = 193.5 credits per 100 images
  output_text: 1500.0, // $150.00 per 1M characters = 1500 credits per 1M chars
  output_image: 40.0, // $4.00 per 100 images = 40 credits per 100 images
} as const;

// Calculate cost for image generation (returns credits)
export function calculateGenerationCost(
  provider: keyof typeof GENERATION_COSTS,
  model?: string,
  size?: string,
  quality: string = 'auto',
): number {
  const providerCosts = GENERATION_COSTS[provider];

  if (!providerCosts) {
    return 0.1; // Default cost (0.10 credits)
  }

  if (provider === 'openai' && model && size) {
    const openaiCosts = providerCosts as typeof GENERATION_COSTS.openai;
    if (model in openaiCosts) {
      const modelCosts = openaiCosts[model as keyof typeof openaiCosts];
      if (typeof modelCosts === 'object' && size in modelCosts) {
        let baseCost = modelCosts[size as keyof typeof modelCosts] || 0.3;

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
            case 'low':
              baseCost *= 1; // $0.011
              break;
            case 'auto':
              baseCost *= 1; // $0.011
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

  return 0.1; // Fallback
}

// Calculate cost for image editing (higher than generation)
export function calculateEditingCost(
  provider: keyof typeof GENERATION_COSTS,
  model?: string,
  size?: string,
  quality?: string,
): number {
  const baseCost = calculateGenerationCost(provider, model, size, quality);
  const editingCost = baseCost * EDITING_COST_MULTIPLIER;
  return Math.max(editingCost, MINIMUM_EDITING_COST);
}

// Calculate token cost for GPT-Image-1 (returns credits)
export function calculateGPTImageTokenCost(
  inputTokens: number,
  outputTokens: number,
  cachedInputTokens: number = 0,
  tokenDetails?: {
    text_tokens?: number;
    image_tokens?: number;
  },
): number {
  // If we have detailed token breakdown, use it
  if (tokenDetails) {
    const textTokens = tokenDetails.text_tokens || 0;
    const imageTokens = tokenDetails.image_tokens || 0;
    const cachedTextTokens = Math.min(cachedInputTokens, textTokens);
    const cachedImageTokens = Math.max(0, cachedInputTokens - cachedTextTokens);

    const textInputCost =
      ((textTokens - cachedTextTokens) * GPT_IMAGE_TOKEN_COSTS.text_input) / 1000000;
    const textCachedCost = (cachedTextTokens * GPT_IMAGE_TOKEN_COSTS.text_cached_input) / 1000000;
    const imageInputCost =
      ((imageTokens - cachedImageTokens) * GPT_IMAGE_TOKEN_COSTS.image_input) / 1000000;
    const imageCachedCost =
      (cachedImageTokens * GPT_IMAGE_TOKEN_COSTS.image_cached_input) / 1000000;
    const imageOutputCost = (outputTokens * GPT_IMAGE_TOKEN_COSTS.image_output) / 1000000;

    return textInputCost + textCachedCost + imageInputCost + imageCachedCost + imageOutputCost;
  }

  // Fallback to treating all input tokens as image tokens (previous behavior)
  const inputCost =
    ((inputTokens - cachedInputTokens) * GPT_IMAGE_TOKEN_COSTS.image_input) / 1000000;
  const cachedCost = (cachedInputTokens * GPT_IMAGE_TOKEN_COSTS.image_cached_input) / 1000000;
  const outputCost = (outputTokens * GPT_IMAGE_TOKEN_COSTS.image_output) / 1000000;

  return inputCost + cachedCost + outputCost;
}

// Calculate token cost for Gemini 2.0 Flash (returns credits)
export function calculateGeminiTokenCost(
  inputTextTokens: number,
  inputImageTokens: number,
  outputTextTokens: number,
  outputImageCount: number = 1,
): number {
  // Convert tokens to appropriate units for cost calculation
  const inputTextCost = (inputTextTokens * GEMINI_TOKEN_COSTS.input_text) / 1000000;
  const inputImageCost = (inputImageTokens * GEMINI_TOKEN_COSTS.input_image) / 1000000;
  const outputTextCost = (outputTextTokens * GEMINI_TOKEN_COSTS.output_text) / 1000000;
  const outputImageCost = (outputImageCount * GEMINI_TOKEN_COSTS.output_image) / 100;

  return inputTextCost + inputImageCost + outputTextCost + outputImageCost;
}

// Calculate total cost for GPT-Image-1 generation (image + tokens, returns credits)
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
  },
): number {
  // Image generation cost
  const imageCost = calculateGenerationCost('openai', 'gpt-image-1', size, quality);

  // Token cost (if usage data is provided)
  let tokenCost = 0;
  if (usage) {
    tokenCost = calculateGPTImageTokenCost(
      usage.input_tokens,
      usage.output_tokens,
      0, // No cached tokens info in this usage format
      usage.input_tokens_details,
    );
  }

  console.log('GPT-Image total cost calculation:', {
    size,
    quality,
    usage,
    imageCost,
    tokenCost,
    totalCost: imageCost + tokenCost,
  });

  return imageCost + tokenCost;
}

// Calculate total cost for Gemini 2.0 Flash generation (image + tokens, returns credits)
export function calculateGeminiTotalCost(usage?: {
  promptTokenCount?: number;
  candidatesTokenCount?: number;
  totalTokenCount?: number;
  promptTokensDetails?: Array<{
    modality: string;
    tokenCount: number;
  }>;
  candidatesTokensDetails?: Array<{
    modality: string;
    tokenCount: number;
  }>;
}): number {
  // Always include base image cost
  const baseImageCost = calculateGenerationCost(
    'google',
    'gemini-2.0-flash-preview-image-generation',
  );

  if (!usage) {
    // Return base cost if no usage data
    return baseImageCost;
  }

  // Extract token counts by modality
  let inputTextTokens = 0;
  let inputImageTokens = 0;
  let outputTextTokens = 0;
  let outputImageTokens = 0;

  // Parse prompt tokens (input)
  if (usage.promptTokensDetails) {
    for (const detail of usage.promptTokensDetails) {
      if (detail.modality === 'TEXT') {
        inputTextTokens += detail.tokenCount;
      } else if (detail.modality === 'IMAGE') {
        inputImageTokens += detail.tokenCount;
      }
    }
  }

  // Parse candidate tokens (output)
  if (usage.candidatesTokensDetails) {
    for (const detail of usage.candidatesTokensDetails) {
      if (detail.modality === 'TEXT') {
        outputTextTokens += detail.tokenCount;
      } else if (detail.modality === 'IMAGE') {
        outputImageTokens += detail.tokenCount;
      }
    }
  }

  // Calculate token cost
  const tokenCost = calculateGeminiTokenCost(
    inputTextTokens,
    inputImageTokens,
    outputTextTokens,
    outputImageTokens > 0 ? 1 : 0, // Assume 1 image generated if image tokens present
  );

  console.log('Gemini total cost calculation:', {
    usage,
    inputTextTokens,
    inputImageTokens,
    outputTextTokens,
    outputImageTokens,
    baseImageCost,
    tokenCost,
    totalCost: baseImageCost + tokenCost,
  });

  // Return base image cost + token cost
  return baseImageCost + tokenCost;
}

// Free tier limits and new user credits
export const FREE_TIER_LIMITS = {
  dailyCredits: 5,
  monthlyCredits: 50,
  maxResolution: '1024x1024',
  allowedProviders: ['openai', 'google'],
} as const;

// New user starting credits
export const NEW_USER_CREDITS = 10; // Each new user gets 10 free credits ($1.00 value)

// Auto top-up options (aligned with 1 credit = $0.10)
export const AUTO_TOPUP_OPTIONS = [
  { credits: 50, price: 500 }, // $5.00
  { credits: 100, price: 1000 }, // $10.00
  { credits: 200, price: 2000 }, // $20.00
  { credits: 500, price: 5000 }, // $50.00
] as const;

// Utility functions for credit calculations
export function creditsToUSD(credits: number): number {
  return credits * 0.1; // 1 credit = $0.10
}

export function usdToCredits(usd: number): number {
  return usd / 0.1; // $0.10 = 1 credit
}

export function formatCredits(credits: number): string {
  return credits.toFixed(2) + ' credits';
}

export function formatCreditsWithUSD(credits: number): string {
  const usdValue = creditsToUSD(credits);
  return `${credits.toFixed(2)} credits ($${usdValue.toFixed(2)})`;
}
