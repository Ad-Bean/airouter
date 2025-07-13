import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { refreshSignedUrl } from '@/lib/s3';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { imageId } = await request.json();

    if (!imageId) {
      return NextResponse.json({ error: 'Image ID is required' }, { status: 400 });
    }

    // Find the image and verify ownership
    const image = await prisma.generatedImage.findFirst({
      where: {
        id: imageId,
        userId: session.user.id,
        deleted: false,
      },
    });

    if (!image || !image.s3Key) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    // Check if URL needs refresh (expires within 1 hour)
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

    if (image.expiresAt && image.expiresAt > oneHourFromNow) {
      // URL is still valid, return existing
      return NextResponse.json({
        signedUrl: image.s3Url,
        expiresAt: image.expiresAt,
      });
    }

    // Generate new signed URL
    const { signedUrl, expiresAt } = await refreshSignedUrl(image.s3Key);

    // Update database with new signed URL and expiration
    await prisma.generatedImage.update({
      where: { id: imageId },
      data: {
        s3Url: signedUrl,
        expiresAt,
      },
    });

    return NextResponse.json({
      signedUrl,
      expiresAt,
    });
  } catch (error) {
    console.error('Error refreshing signed URL:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
