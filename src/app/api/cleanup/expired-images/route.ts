import { NextRequest, NextResponse } from "next/server";
import { prisma, withDatabaseRetry } from "@/lib/prisma";
import { deleteFromS3 } from "@/lib/s3";

export async function POST(request: NextRequest) {
  try {
    // This endpoint should only be called by a cron job or internal service
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("Starting cleanup of expired images...");

    // Find all images that should be auto-deleted
    const expiredImages = await withDatabaseRetry(async () => {
      return await prisma.generatedImage.findMany({
        where: {
          deleted: false,
          autoDeleteAt: {
            lte: new Date(),
          },
        },
        select: {
          id: true,
          s3Key: true,
          s3Bucket: true,
          userId: true,
          prompt: true,
        },
        take: 100, // Process in batches
      });
    });

    if (expiredImages.length === 0) {
      console.log("No expired images found");
      return NextResponse.json({ 
        success: true, 
        message: "No expired images found",
        processed: 0,
      });
    }

    console.log(`Found ${expiredImages.length} expired images to clean up`);

    let successCount = 0;
    let errorCount = 0;

    // Process each expired image
    for (const image of expiredImages) {
      try {
        // Mark as deleted in database first
        await withDatabaseRetry(async () => {
          await prisma.generatedImage.update({
            where: { id: image.id },
            data: {
              deleted: true,
              deletedAt: new Date(),
            },
          });
        });

        // Delete from S3 if it exists
        if (image.s3Key && image.s3Bucket) {
          try {
            await deleteFromS3(image.s3Key, image.s3Bucket);
            console.log(`Deleted image ${image.id} from S3`);
          } catch (s3Error) {
            console.error(`Failed to delete image ${image.id} from S3:`, s3Error);
            // Continue processing other images even if S3 deletion fails
          }
        }

        successCount++;
        console.log(`Successfully processed expired image ${image.id} for user ${image.userId}`);

      } catch (error) {
        errorCount++;
        console.error(`Failed to process expired image ${image.id}:`, error);
      }
    }

    console.log(`Cleanup completed: ${successCount} successful, ${errorCount} errors`);

    return NextResponse.json({
      success: true,
      message: "Cleanup completed",
      processed: successCount,
      errors: errorCount,
      total: expiredImages.length,
    });

  } catch (error) {
    console.error("Error in cleanup job:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
