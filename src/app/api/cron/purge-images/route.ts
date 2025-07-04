import { NextResponse } from 'next/server';
import { bulkDeleteExpiredImages, cleanupOrphanedRecords, setAutoDeleteForFreePlan } from '@/lib/storage-utils';

export async function GET(request: Request) {
  try {
    // Basic auth check for cron job (should be called by your cron service)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Set auto-delete for free plan users first
    const autoDeleteCount = await setAutoDeleteForFreePlan();
    
    // Delete expired images
    const deleteResult = await bulkDeleteExpiredImages();
    
    // Clean up orphaned records
    const orphanedCount = await cleanupOrphanedRecords();

    // Log the purge operation
    console.log(`Purge operation completed:`, {
      autoDeleteSet: autoDeleteCount,
      imagesDeleted: deleteResult.deleted,
      s3KeysDeleted: deleteResult.s3KeysDeleted,
      orphanedCleaned: orphanedCount,
      errors: deleteResult.errors,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      message: 'Purge operation completed successfully',
      stats: {
        autoDeleteSet: autoDeleteCount,
        imagesDeleted: deleteResult.deleted,
        s3KeysDeleted: deleteResult.s3KeysDeleted,
        orphanedCleaned: orphanedCount,
        errors: deleteResult.errors,
      },
    });
  } catch (error) {
    console.error('Error in purge operation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
