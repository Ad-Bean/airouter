import crypto from 'crypto';
import { prisma } from './prisma';

export function generateApiKey(): string {
  // Generate a secure random API key with prefix
  const randomBytes = crypto.randomBytes(32);
  const apiKey = `ak_${randomBytes.toString('hex')}`;
  return apiKey;
}

export async function validateApiKey(apiKey: string) {
  if (!apiKey || !apiKey.startsWith('ak_')) {
    return null;
  }

  try {
    const keyRecord = await prisma.apiKey.findUnique({
      where: { key: apiKey },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            credits: true,
            userType: true,
            name: true,
          },
        },
      },
    });

    if (!keyRecord || !keyRecord.isActive) {
      return null;
    }

    // Update usage statistics
    await prisma.apiKey.update({
      where: { id: keyRecord.id },
      data: {
        lastUsed: new Date(),
        usageCount: { increment: 1 },
      },
    });

    return {
      ...keyRecord.user,
      apiKeyId: keyRecord.id,
    };
  } catch (error) {
    console.error('Error validating API key:', error);
    return null;
  }
}

export async function createApiKey(userId: string, name: string): Promise<string> {
  const apiKey = generateApiKey();

  await prisma.apiKey.create({
    data: {
      userId,
      name,
      key: apiKey,
    },
  });

  return apiKey;
}

export async function deleteApiKey(userId: string, apiKeyId: string): Promise<void> {
  await prisma.apiKey.deleteMany({
    where: {
      id: apiKeyId,
      userId, // Ensure user can only delete their own keys
    },
  });
}

export async function getUserApiKeys(userId: string) {
  return await prisma.apiKey.findMany({
    where: { userId },
    select: {
      id: true,
      name: true,
      key: true,
      lastUsed: true,
      usageCount: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

export async function updateApiKeyStatus(userId: string, apiKeyId: string, isActive: boolean) {
  await prisma.apiKey.updateMany({
    where: {
      id: apiKeyId,
      userId, // Ensure user can only update their own keys
    },
    data: { isActive },
  });
}

export async function getApiKeyUsage(userId: string, apiKeyId: string) {
  const apiKey = await prisma.apiKey.findFirst({
    where: {
      id: apiKeyId,
      userId,
    },
    select: {
      name: true,
      usageCount: true,
      lastUsed: true,
      createdAt: true,
    },
  });

  if (!apiKey) {
    return null;
  }

  // Get transaction history for this API key
  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      apiKeyId,
    },
    select: {
      id: true,
      type: true,
      amount: true,
      description: true,
      metadata: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 50, // Limit to last 50 transactions
  });

  return {
    ...apiKey,
    transactions,
  };
}
