import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma, withDatabaseRetry } from "@/lib/prisma";
import { deleteFromS3 } from "@/lib/s3";

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: imageId } = await context.params;

    // Find the image and verify ownership
    const image = await withDatabaseRetry(async () => {
      return await prisma.generatedImage.findUnique({
        where: { id: imageId },
        select: {
          id: true,
          userId: true,
          s3Key: true,
          s3Bucket: true,
          deleted: true,
        },
      });
    });

    if (!image) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    if (image.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (image.deleted) {
      return NextResponse.json({ error: "Image already deleted" }, { status: 400 });
    }

    // Soft delete the image in the database
    await withDatabaseRetry(async () => {
      await prisma.generatedImage.update({
        where: { id: imageId },
        data: {
          deleted: true,
          deletedAt: new Date(),
        },
      });
    });

    // Schedule S3 deletion in the background
    if (image.s3Key && image.s3Bucket) {
      // Run S3 deletion in background
      setImmediate(async () => {
        try {
          await deleteFromS3(image.s3Key!, image.s3Bucket!);
          console.log(`Successfully deleted image ${imageId} from S3`);
        } catch (error) {
          console.error(`Failed to delete image ${imageId} from S3:`, error);
        }
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Image deleted successfully" 
    });

  } catch (error) {
    console.error("Error deleting image:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
