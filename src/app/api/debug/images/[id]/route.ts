import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    // Only allow debug access to authenticated users
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const image = await prisma.generatedImage.findUnique({
      where: { id },
      select: {
        id: true,
        s3Url: true,
        s3Key: true,
        s3Bucket: true,
        expiresAt: true,
        imagePath: true,
        mimeType: true,
        filename: true,
        imageUrl: true,
        isPublic: true,
        userId: true,
        deleted: true,
        autoDeleteAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!image) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    // Debug information
    const debugInfo = {
      image,
      hasS3Data: !!(image.s3Key && image.s3Bucket),
      hasS3Url: !!image.s3Url,
      s3UrlExpired: image.expiresAt ? image.expiresAt <= new Date() : null,
      hasLocalPath: !!image.imagePath,
      hasLegacyUrl: !!image.imageUrl,
      isDeleted: image.deleted,
      isExpired: image.autoDeleteAt ? image.autoDeleteAt <= new Date() : false,
      isOwner: session.user.id === image.userId,
      canAccess: image.isPublic || session.user.id === image.userId,
      currentTime: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        hasS3Config: !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.AWS_S3_BUCKET_NAME),
      },
    };

    return NextResponse.json(debugInfo, { status: 200 });
  } catch (error) {
    console.error("Error in image debug route:", error);
    return NextResponse.json(
      { 
        error: "Failed to get debug info",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
