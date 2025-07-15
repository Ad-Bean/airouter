import { prisma } from '@/lib/prisma';
import { refreshSignedUrl, batchDeleteFromS3 } from '@/lib/s3';

/**
 * Utility functions for managing S3 storage operations
 */

export interface StorageStats {
  totalImages: number;
  expiredUrls: number;
  toDelete: number;
  storageUsed: number; // in bytes
}

/**
 * Get storage statistics
 */
export async function getStorageStats(): Promise<StorageStats> {
  const now = new Date();
  const sixHoursFromNow = new Date(now.getTime() + 6 * 60 * 60 * 1000);

  const [totalImages, expiredUrls, toDelete] = await Promise.all([
    prisma.generatedImage.count({
      where: {
        s3Key: { not: null },
        deleted: false,
      },
    }),
    prisma.generatedImage.count({
      where: {
        s3Key: { not: null },
        deleted: false,
        expiresAt: { lte: sixHoursFromNow },
      },
    }),
    prisma.generatedImage.count({
      where: {
        OR: [{ expiresAt: { lte: now } }, { autoDeleteAt: { lte: now } }],
        deleted: false,
      },
    }),
  ]);

  return {
    totalImages,
    expiredUrls,
    toDelete,
    storageUsed: 0, // TODO: Calculate actual storage used
  };
}

/**
 * Bulk refresh signed URLs for images about to expire
 */
export async function bulkRefreshSignedUrls(batchSize: number = 50): Promise<{
  processed: number;
  successful: number;
  failed: number;
}> {
  const now = new Date();
  const sixHoursFromNow = new Date(now.getTime() + 6 * 60 * 60 * 1000);

  const imagesToRefresh = await prisma.generatedImage.findMany({
    where: {
      s3Key: { not: null },
      deleted: false,
      expiresAt: { lte: sixHoursFromNow },
    },
    select: {
      id: true,
      s3Key: true,
    },
    take: batchSize,
  });

  let successful = 0;
  let failed = 0;

  for (const image of imagesToRefresh) {
    try {
      if (!image.s3Key) continue;

      const { signedUrl, expiresAt } = await refreshSignedUrl(image.s3Key);

      await prisma.generatedImage.update({
        where: { id: image.id },
        data: {
          s3Url: signedUrl,
          expiresAt,
        },
      });

      successful++;
    } catch (error) {
      console.error(`Failed to refresh URL for image ${image.id}:`, error);
      failed++;
    }
  }

  return {
    processed: imagesToRefresh.length,
    successful,
    failed,
  };
}

/**
 * Bulk delete expired images
 */
export async function bulkDeleteExpiredImages(): Promise<{
  deleted: number;
  s3KeysDeleted: number;
  errors: string[];
}> {
  const now = new Date();
  const errors: string[] = [];

  const imagesToDelete = await prisma.generatedImage.findMany({
    where: {
      OR: [{ expiresAt: { lte: now } }, { autoDeleteAt: { lte: now } }],
      deleted: false,
    },
    select: {
      id: true,
      s3Key: true,
    },
  });

  const s3Keys = imagesToDelete.filter((image) => image.s3Key).map((image) => image.s3Key!);

  let s3KeysDeleted = 0;

  // Delete from S3
  if (s3Keys.length > 0) {
    try {
      await batchDeleteFromS3(s3Keys);
      s3KeysDeleted = s3Keys.length;
    } catch (error) {
      errors.push(`S3 deletion failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Update database
  const imageIds = imagesToDelete.map((image) => image.id);
  await prisma.generatedImage.updateMany({
    where: {
      id: { in: imageIds },
    },
    data: {
      deleted: true,
      deletedAt: now,
    },
  });

  return {
    deleted: imagesToDelete.length,
    s3KeysDeleted,
    errors,
  };
}

/**
 * Clean up orphaned database records (no S3 key)
 */
export async function cleanupOrphanedRecords(): Promise<number> {
  const orphanedImages = await prisma.generatedImage.findMany({
    where: {
      s3Key: null,
      s3Url: null,
      imagePath: null,
      imageUrl: null,
      deleted: false,
    },
    select: {
      id: true,
    },
  });

  if (orphanedImages.length === 0) return 0;

  const imageIds = orphanedImages.map((image) => image.id);
  await prisma.generatedImage.updateMany({
    where: {
      id: { in: imageIds },
    },
    data: {
      deleted: true,
      deletedAt: new Date(),
    },
  });

  return orphanedImages.length;
}

/**
 * Set auto-delete for free users (10 minutes) and paid users (7 days)
 */
export async function setAutoDeleteForFreeUsers(): Promise<number> {
  const now = new Date();
  const tenMinutesFromNow = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes for free users
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days for paid users

  // Update free users' images to auto-delete in 10 minutes
  const freeUserResult = await prisma.generatedImage.updateMany({
    where: {
      autoDeleteAt: null,
      deleted: false,
      user: {
        userType: 'free',
      },
    },
    data: {
      autoDeleteAt: tenMinutesFromNow,
    },
  });

  // Update paid users' images to auto-delete in 7 days
  await prisma.generatedImage.updateMany({
    where: {
      autoDeleteAt: null,
      deleted: false,
      user: {
        userType: 'paid',
      },
    },
    data: {
      autoDeleteAt: sevenDaysFromNow,
    },
  });

  return freeUserResult.count;
}

/**
 * Get auto-delete date based on user type
 */
export function getAutoDeleteDate(userType: string): Date {
  const now = new Date();
  if (userType === 'free') {
    return new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes for free users
  } else {
    return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days for paid users
  }
}

/**
 * Get time remaining until auto-delete
 */
export function getTimeRemaining(autoDeleteAt: Date): {
  expired: boolean;
  timeLeft: string;
  minutes: number;
} {
  const now = new Date();
  const timeDiff = autoDeleteAt.getTime() - now.getTime();

  if (timeDiff <= 0) {
    return { expired: true, timeLeft: 'Expired', minutes: 0 };
  }

  const minutes = Math.floor(timeDiff / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return { expired: false, timeLeft: `${days}d ${hours % 24}h`, minutes };
  } else if (hours > 0) {
    return { expired: false, timeLeft: `${hours}h ${minutes % 60}m`, minutes };
  } else {
    return { expired: false, timeLeft: `${minutes}m`, minutes };
  }
}
