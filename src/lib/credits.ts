import { prisma } from '@/lib/prisma';
import {
  calculateGenerationCost,
  calculateEditingCost,
  calculateGPTImageTotalCost,
  calculateGeminiTotalCost,
  EDITING_COST_MULTIPLIER,
  MINIMUM_EDITING_COST,
} from '@/config/credits';

export interface DeductCreditsParams {
  userId: string;
  provider: string;
  model?: string;
  size?: string;
  quality?: string;
  isEditing?: boolean; // Flag to indicate if this is for image editing
  usage?: {
    total_tokens?: number;
    input_tokens?: number;
    output_tokens?: number;
    input_tokens_details?: {
      text_tokens?: number;
      image_tokens?: number;
    };
    // Gemini usage metadata
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
  };
  description?: string;
}

export interface DeductCreditsResult {
  success: boolean;
  creditsDeducted: number;
  remainingCredits: number;
  error?: string;
}

export interface AddCreditsParams {
  userId: string;
  amount: number;
  description: string;
  metadata?: Record<string, string | number | boolean> | null;
}

export interface AddCreditsResult {
  success: boolean;
  newBalance: number;
  error?: string;
}

/**
 * Deduct credits from user account for image generation
 */
export async function deductCredits({
  userId,
  provider,
  model,
  size,
  quality,
  isEditing = false,
  usage,
  description,
}: DeductCreditsParams): Promise<DeductCreditsResult> {
  try {
    // Calculate cost based on provider and settings
    let cost: number;

    if (provider === 'openai' && model === 'gpt-image-1' && usage?.total_tokens) {
      // Use special calculation for GPT-Image-1 with token costs
      const validUsage = {
        total_tokens: usage.total_tokens,
        input_tokens: usage.input_tokens || 0,
        output_tokens: usage.output_tokens || 0,
        input_tokens_details:
          usage.input_tokens_details &&
          usage.input_tokens_details.text_tokens !== undefined &&
          usage.input_tokens_details.image_tokens !== undefined
            ? {
                text_tokens: usage.input_tokens_details.text_tokens,
                image_tokens: usage.input_tokens_details.image_tokens,
              }
            : undefined,
      };
      cost = calculateGPTImageTotalCost(size || '1024x1024', quality || 'low', validUsage);

      // Apply editing multiplier if this is for editing
      if (isEditing) {
        cost = cost * EDITING_COST_MULTIPLIER;
        cost = Math.max(cost, MINIMUM_EDITING_COST); // Ensure minimum editing cost
      }
    } else if (
      provider === 'google' &&
      model === 'gemini-2.0-flash-preview-image-generation' &&
      usage
    ) {
      // Use special calculation for Gemini 2.0 Flash with token costs
      const validUsage = {
        promptTokenCount: usage.promptTokenCount,
        candidatesTokenCount: usage.candidatesTokenCount,
        totalTokenCount: usage.totalTokenCount,
        promptTokensDetails: usage.promptTokensDetails,
        candidatesTokensDetails: usage.candidatesTokensDetails,
      };
      cost = calculateGeminiTotalCost(validUsage);

      // Ensure minimum cost even if no usage data or tokens
      const minCost = calculateGenerationCost(
        'google',
        'gemini-2.0-flash-preview-image-generation',
      );
      cost = Math.max(cost, minCost);

      console.log(`Google Gemini cost calculation:`, {
        provider,
        model,
        isEditing,
        usage: validUsage,
        calculatedCost: cost,
        minCost,
        finalCost: isEditing
          ? Math.max(cost * EDITING_COST_MULTIPLIER, MINIMUM_EDITING_COST)
          : cost,
      });

      // Apply editing multiplier if this is for editing
      if (isEditing) {
        cost = cost * EDITING_COST_MULTIPLIER;
        cost = Math.max(cost, MINIMUM_EDITING_COST); // Ensure minimum editing cost
      }
    } else if (provider === 'google' && model === 'gemini-2.0-flash-preview-image-generation') {
      // Handle Google Gemini without usage data - use base cost
      cost = calculateGenerationCost('google', 'gemini-2.0-flash-preview-image-generation');

      console.log(`Google Gemini base cost calculation:`, {
        provider,
        model,
        isEditing,
        baseCost: cost,
        finalCost: isEditing
          ? Math.max(cost * EDITING_COST_MULTIPLIER, MINIMUM_EDITING_COST)
          : cost,
      });

      // Apply editing multiplier if this is for editing
      if (isEditing) {
        cost = cost * EDITING_COST_MULTIPLIER;
        cost = Math.max(cost, MINIMUM_EDITING_COST); // Ensure minimum editing cost
      }
    } else {
      // Use regular calculation
      if (isEditing) {
        cost = calculateEditingCost(
          provider as keyof typeof import('@/config/credits').GENERATION_COSTS,
          model,
          size,
          quality,
        );
      } else {
        cost = calculateGenerationCost(
          provider as keyof typeof import('@/config/credits').GENERATION_COSTS,
          model,
          size,
          quality,
        );
      }
    }

    // Get user's current credits
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { credits: true },
    });

    if (!user) {
      return {
        success: false,
        creditsDeducted: 0,
        remainingCredits: 0,
        error: 'User not found',
      };
    }

    // Check if user has enough credits
    if (user.credits < cost) {
      return {
        success: false,
        creditsDeducted: 0,
        remainingCredits: user.credits,
        error: 'Insufficient credits',
      };
    }

    // Deduct credits in a transaction
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        credits: {
          decrement: cost,
        },
      },
    });

    // Record the transaction
    await prisma.transaction.create({
      data: {
        userId,
        type: 'usage',
        amount: -cost,
        balanceAfter: updatedUser.credits,
        description: description || `Image generation (${provider})`,
        metadata: {
          provider,
          model,
          size,
          quality,
          ...(usage && { usage }),
        },
      },
    });

    return {
      success: true,
      creditsDeducted: cost,
      remainingCredits: updatedUser.credits,
    };
  } catch (error) {
    console.error('Error deducting credits:', error);
    return {
      success: false,
      creditsDeducted: 0,
      remainingCredits: 0,
      error: 'Failed to deduct credits',
    };
  }
}

/**
 * Add credits to user account
 */
export async function addCredits({
  userId,
  amount,
  description,
  metadata,
}: AddCreditsParams): Promise<AddCreditsResult> {
  try {
    // Add credits in a transaction
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        credits: {
          increment: amount,
        },
      },
    });

    // Record the transaction
    await prisma.transaction.create({
      data: {
        userId,
        type: 'purchase',
        amount,
        balanceAfter: updatedUser.credits,
        description,
        metadata: metadata || undefined,
      },
    });

    return {
      success: true,
      newBalance: updatedUser.credits,
    };
  } catch (error) {
    console.error('Error adding credits:', error);
    return {
      success: false,
      newBalance: 0,
      error: 'Failed to add credits',
    };
  }
}

/**
 * Get user's current credit balance
 */
export async function getUserCredits(userId: string): Promise<number> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { credits: true },
    });

    return user?.credits || 0;
  } catch (error) {
    console.error('Error getting user credits:', error);
    return 0;
  }
}

/**
 * Check if user has enough credits for a generation
 */
export async function checkCredits(
  userId: string,
  provider: string,
  model?: string,
  size?: string,
  quality?: string,
  isEditing?: boolean, // Flag to indicate if this is for image editing
): Promise<{ hasEnough: boolean; required: number; available: number }> {
  const required = isEditing
    ? calculateEditingCost(
        provider as keyof typeof import('@/config/credits').GENERATION_COSTS,
        model,
        size,
        quality,
      )
    : calculateGenerationCost(
        provider as keyof typeof import('@/config/credits').GENERATION_COSTS,
        model,
        size,
        quality,
      );
  const available = await getUserCredits(userId);

  return {
    hasEnough: available >= required,
    required,
    available,
  };
}
