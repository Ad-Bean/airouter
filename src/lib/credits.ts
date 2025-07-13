import { prisma } from '@/lib/prisma';
import { calculateGenerationCost, calculateGPTImageTotalCost } from '@/config/credits';

export interface DeductCreditsParams {
  userId: string;
  provider: string;
  model?: string;
  size?: string;
  quality?: string;
  usage?: {
    total_tokens?: number;
    input_tokens?: number;
    output_tokens?: number;
    input_tokens_details?: {
      text_tokens?: number;
      image_tokens?: number;
    };
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
        input_tokens_details: usage.input_tokens_details && usage.input_tokens_details.text_tokens !== undefined && usage.input_tokens_details.image_tokens !== undefined
          ? {
              text_tokens: usage.input_tokens_details.text_tokens,
              image_tokens: usage.input_tokens_details.image_tokens,
            }
          : undefined,
      };
      cost = calculateGPTImageTotalCost(size || '1024x1024', quality || 'low', validUsage);
    } else {
      // Use regular calculation
      cost = calculateGenerationCost(
        provider as keyof typeof import('@/config/credits').GENERATION_COSTS,
        model,
        size,
        quality
      );
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
  quality?: string
): Promise<{ hasEnough: boolean; required: number; available: number }> {
  const required = calculateGenerationCost(
    provider as keyof typeof import('@/config/credits').GENERATION_COSTS,
    model,
    size,
    quality
  );
  const available = await getUserCredits(userId);

  return {
    hasEnough: available >= required,
    required,
    available,
  };
}
