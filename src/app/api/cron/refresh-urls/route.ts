import { NextResponse } from 'next/server';
import { bulkRefreshSignedUrls, getStorageStats } from '@/lib/storage-utils';

export async function GET(request: Request) {
  try {
    // Basic auth check for cron job
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get storage statistics
    const stats = await getStorageStats();

    if (stats.expiredUrls === 0) {
      return NextResponse.json({
        message: 'No URLs to refresh',
        stats: {
          totalImages: stats.totalImages,
          expiredUrls: stats.expiredUrls,
          processed: 0,
          successful: 0,
          failed: 0,
        },
      });
    }

    // Refresh URLs in batches
    const batchSize = 50;
    let totalProcessed = 0;
    let totalSuccessful = 0;
    let totalFailed = 0;

    while (totalProcessed < stats.expiredUrls) {
      const result = await bulkRefreshSignedUrls(batchSize);

      totalProcessed += result.processed;
      totalSuccessful += result.successful;
      totalFailed += result.failed;

      // If no more images to process, break
      if (result.processed === 0) break;
    }

    console.log(`URL refresh completed:`, {
      totalImages: stats.totalImages,
      expiredUrls: stats.expiredUrls,
      processed: totalProcessed,
      successful: totalSuccessful,
      failed: totalFailed,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      message: `Successfully refreshed ${totalSuccessful} signed URLs`,
      stats: {
        totalImages: stats.totalImages,
        expiredUrls: stats.expiredUrls,
        processed: totalProcessed,
        successful: totalSuccessful,
        failed: totalFailed,
      },
    });
  } catch (error) {
    console.error('Error refreshing signed URLs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
