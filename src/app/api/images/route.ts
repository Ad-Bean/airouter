import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const provider = searchParams.get('provider');
    const favorites = searchParams.get('favorites') === 'true';
    const includeDeleted = searchParams.get('includeDeleted') === 'true';

    const skip = (page - 1) * limit;

    // Build where clause
    const where: {
      userId: string;
      provider?: string;
      isFavorite?: boolean;
      deleted?: boolean;
    } = {
      userId: session.user.id,
      ...(includeDeleted ? {} : { deleted: false }),
    };

    if (provider) {
      where.provider = provider;
    }

    if (favorites) {
      where.isFavorite = true;
    }

    // Get images with pagination
    const [images, total] = await Promise.all([
      prisma.generatedImage.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          prompt: true,
          // S3 fields (primary)
          s3Url: true,
          s3Key: true,
          s3Bucket: true,
          // Legacy/fallback fields
          imageUrl: true,
          imagePath: true,
          // Metadata
          mimeType: true,
          filename: true,
          provider: true,
          model: true,
          width: true,
          height: true,
          steps: true,
          isFavorite: true,
          isPublic: true,
          createdAt: true,
        },
      }),
      prisma.generatedImage.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      images,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get images error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { imageId } = await request.json();

    if (!imageId) {
      return NextResponse.json({ error: 'Image ID is required' }, { status: 400 });
    }

    // Get the image to check ownership and get storage info
    const image = await prisma.generatedImage.findFirst({
      where: {
        id: imageId,
        userId: session.user.id,
      },
    });

    if (!image) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    // Delete from storage if we have a stored pathname
    if (image.storedPathname) {
      try {
        const { ImageStorage } = await import('@/lib/storage');
        await ImageStorage.deleteImage(image.storedPathname);
      } catch (storageError) {
        console.warn('Failed to delete image from storage:', storageError);
        // Continue with database deletion even if storage fails
      }
    }

    // Delete from database
    await prisma.generatedImage.delete({
      where: { id: imageId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete image error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
