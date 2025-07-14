// Credit pricing and cost configuration

export const CREDIT_PACKAGES = [
  {
    id: 'starter-50',
    name: 'Starter Pack',
    credits: 50,
    price: 499, // $4.99 in cents
    popular: false,
    description: 'Perfect for getting started',
    bonus: 0,
  },
  {
    id: 'starter-100',
    name: 'Starter Pack',
    credits: 100,
    price: 999, // $9.99 in cents
    popular: true,
    description: 'Perfect for getting started',
    bonus: 0,
  },
  {
    id: 'popular',
    name: 'Popular Pack',
    credits: 500,
    price: 3999, // $39.99 in cents
    popular: false,
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
  // {
  //   id: 'enterprise',
  //   name: 'Enterprise Pack',
  //   credits: 5000,
  //   price: 29999, // $299.99 in cents
  //   popular: false,
  //   description: 'For teams and businesses',
  //   bonus: 1000, // Bonus credits
  // },
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
  google: {
    'imagen-4-preview': 4.0, // $0.04
    'imagen-4-standard': 4.0, // $0.04
    'imagen-4-ultra': 6.0, // $0.06
    'imagen-3': 3.0, // $0.03
    'gemini-2.0-flash-preview-image-generation': 2.0, // $0.02 per output image
    default: 4.0,
  },
} as const;

// Image editing cost configuration
export const EDITING_COST_MULTIPLIER = 1.25; // Editing costs 1.25x more than generation
export const MINIMUM_EDITING_COST = 1.0; // Minimum 1 credit for any editing operation

// GPT-Image-1 token costs (per 1M tokens in USD)
export const GPT_IMAGE_TOKEN_COSTS = {
  input: 10.0, // $10.00 per 1M tokens
  cached_input: 2.5, // $2.50 per 1M tokens
  output: 40.0, // $40.00 per 1M tokens
} as const;

// Gemini 2.0 Flash token costs (per 1M tokens/characters in USD)
export const GEMINI_TOKEN_COSTS = {
  input_text: 37.5, // $37.50 per 1M characters ($0.0375 per 1M chars)
  input_image: 19.35, // $19.35 per 100 images ($0.0001935 per image)
  output_text: 150.0, // $150.00 per 1M characters ($0.15 per 1M chars)
  output_image: 4.0, // $4.00 per 100 images ($0.04 per image)
} as const;

// Calculate cost for image generation
export function calculateGenerationCost(
  provider: keyof typeof GENERATION_COSTS,
  model?: string,
  size?: string,
  quality?: string,
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

// Calculate token cost for GPT-Image-1
export function calculateGPTImageTokenCost(
  inputTokens: number,
  outputTokens: number,
  cachedInputTokens: number = 0,
): number {
  const inputCost = ((inputTokens - cachedInputTokens) * GPT_IMAGE_TOKEN_COSTS.input) / 1000000;
  const cachedCost = (cachedInputTokens * GPT_IMAGE_TOKEN_COSTS.cached_input) / 1000000;
  const outputCost = (outputTokens * GPT_IMAGE_TOKEN_COSTS.output) / 1000000;

  return inputCost + cachedCost + outputCost;
}

// Calculate token cost for Gemini 2.0 Flash
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
  },
): number {
  // Image generation cost
  const imageCost = calculateGenerationCost('openai', 'gpt-image-1', size, quality);

  // Token cost (if usage data is provided)
  let tokenCost = 0;
  if (usage) {
    tokenCost = calculateGPTImageTokenCost(usage.input_tokens, usage.output_tokens);
  }

  return imageCost + tokenCost;
}

// Calculate total cost for Gemini 2.0 Flash generation (image + tokens)
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

  // Return base image cost + token cost
  return baseImageCost + tokenCost;
}

// Free tier limits
export const FREE_TIER_LIMITS = {
  dailyCredits: 5,
  monthlyCredits: 50,
  maxResolution: '1024x1024',
  allowedProviders: ['openai', 'google'],
} as const;

// Auto top-up options
export const AUTO_TOPUP_OPTIONS = [
  { credits: 50, price: 499 },
  { credits: 100, price: 999 },
  { credits: 200, price: 1799 },
  { credits: 500, price: 3999 },
] as const;
