import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { refreshSignedUrl } from '@/lib/s3';

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Add more robust ID validation
    if (!id || id.length < 1) {
      return NextResponse.json({ error: 'Invalid image ID' }, { status: 400 });
    }

    const session = await getServerSession(authOptions);

    let image;
    try {
      image = await prisma.generatedImage.findUnique({
        where: { id },
        select: {
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
        },
      });
    } catch (dbError) {
      console.error('Database error when fetching image:', dbError);

      // If database is down, return a placeholder image
      const placeholderSvg = `
        <svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
          <rect width="400" height="400" fill="#f3f4f6"/>
          <text x="200" y="180" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#6b7280">
            Image Unavailable
          </text>
          <text x="200" y="200" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#9ca3af">
            Database temporarily unavailable
          </text>
          <text x="200" y="220" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="#d1d5db">
            Image ID: ${id}
          </text>
        </svg>
      `;

      return new NextResponse(placeholderSvg, {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'no-cache',
        },
      });
    }

    if (!image || image.deleted) {
      // Create a placeholder image for missing/deleted images
      const placeholderSvg = `
        <svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
          <rect width="400" height="400" fill="#f3f4f6"/>
          <text x="200" y="180" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#6b7280">
            Image Not Found
          </text>
          <text x="200" y="200" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#9ca3af">
            This image may have expired or been deleted
          </text>
          <text x="200" y="220" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="#d1d5db">
            Image ID: ${id}
          </text>
        </svg>
      `;

      return new NextResponse(placeholderSvg, {
        status: 200, // Return 200 instead of 404 to avoid breaking UI
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'no-cache',
        },
      });
    }

    // Check if image has expired (auto-delete)
    if (image.autoDeleteAt && new Date(image.autoDeleteAt) <= new Date()) {
      const expiredSvg = `
        <svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
          <rect width="400" height="400" fill="#fef2f2"/>
          <text x="200" y="180" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#dc2626">
            Image Expired
          </text>
          <text x="200" y="200" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#991b1b">
            This image has expired and is no longer available
          </text>
          <text x="200" y="220" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="#dc2626">
            Expired: ${new Date(image.autoDeleteAt).toLocaleString()}
          </text>
        </svg>
      `;

      return new NextResponse(expiredSvg, {
        status: 200,
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'no-cache',
        },
      });
    }

    // Check authorization (unless image is public)
    if (!image.isPublic) {
      if (!session?.user?.id) {
        // Instead of returning 401, return a placeholder for unauthorized access
        const unauthorizedSvg = `
          <svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
            <rect width="400" height="400" fill="#f9fafb"/>
            <text x="200" y="180" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#6b7280">
              Authentication Required
            </text>
            <text x="200" y="200" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#9ca3af">
              Please sign in to view this image
            </text>
          </svg>
        `;

        return new NextResponse(unauthorizedSvg, {
          status: 200,
          headers: {
            'Content-Type': 'image/svg+xml',
            'Cache-Control': 'no-cache',
          },
        });
      }

      // Check if user owns the image
      if (session.user.id !== image.userId) {
        const forbiddenSvg = `
          <svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
            <rect width="400" height="400" fill="#f9fafb"/>
            <text x="200" y="180" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#6b7280">
              Access Denied
            </text>
            <text x="200" y="200" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#9ca3af">
              You don't have permission to view this image
            </text>
          </svg>
        `;

        return new NextResponse(forbiddenSvg, {
          status: 200,
          headers: {
            'Content-Type': 'image/svg+xml',
            'Cache-Control': 'no-cache',
          },
        });
      }
    }

    // Priority 1: S3 signed URL (secure access)
    if (image.s3Key && image.s3Bucket) {
      try {
        let signedUrl = image.s3Url;

        // Check if signed URL needs refresh
        if (!signedUrl || !image.expiresAt || image.expiresAt <= new Date()) {
          const refreshResult = await refreshSignedUrl(image.s3Key);
          signedUrl = refreshResult.signedUrl;

          // Update database with new signed URL
          await prisma.generatedImage.update({
            where: { id },
            data: {
              s3Url: signedUrl,
              expiresAt: refreshResult.expiresAt,
            },
          });
        }

        // Redirect to signed URL for direct access
        const response = await fetch(signedUrl, {
          headers: {
            'User-Agent': 'airouter-image-proxy',
          },
          // Add timeout to prevent hanging requests
          signal: AbortSignal.timeout(10000),
        });

        if (!response.ok) {
          console.error(`Failed to fetch S3 image: ${response.status} ${response.statusText}`);
          throw new Error(`Failed to fetch image: ${response.status}`);
        }

        const imageBuffer = await response.arrayBuffer();
        const headers = new Headers();
        headers.set('Content-Type', image.mimeType || 'image/png');
        headers.set('Cache-Control', 'public, max-age=3600');
        headers.set('Access-Control-Allow-Origin', '*');
        headers.set('Access-Control-Allow-Methods', 'GET');
        headers.set('Access-Control-Allow-Headers', 'Content-Type');
        headers.set('X-Content-Type-Options', 'nosniff');

        return new NextResponse(imageBuffer, {
          status: 200,
          headers,
        });
      } catch (s3Error) {
        console.error('Error with S3 signed URL:', s3Error);
        // Continue to fallback methods
      }
    }

    // Priority 2: Local file system (fallback)
    if (image.imagePath && image.mimeType) {
      // Serve from local file system
      try {
        const fs = await import('fs/promises');
        const path = await import('path');
        const filePath = path.join(process.cwd(), 'public', image.imagePath);
        const fileBuffer = await fs.readFile(filePath);

        const headers = new Headers();
        headers.set('Content-Type', image.mimeType);
        headers.set('Cache-Control', 'public, max-age=31536000, immutable');

        if (image.filename) {
          headers.set('Content-Disposition', `inline; filename="${image.filename}"`);
        }

        return new NextResponse(new Uint8Array(fileBuffer), {
          status: 200,
          headers,
        });
      } catch (fileError) {
        console.error('Error reading local file:', fileError);
        // Continue to next fallback
      }
    }

    // Priority 3: Legacy imageUrl
    if (image.imageUrl) {
      try {
        const response = await fetch(image.imageUrl, {
          headers: {
            'User-Agent': 'airouter-image-proxy',
          },
          signal: AbortSignal.timeout(10000),
        });

        if (!response.ok) {
          console.error(`Failed to fetch legacy image: ${response.status} ${response.statusText}`);
          throw new Error(`Failed to fetch image: ${response.status}`);
        }

        const imageBuffer = await response.arrayBuffer();
        const headers = new Headers();
        headers.set('Content-Type', image.mimeType || 'image/png');
        headers.set('Cache-Control', 'public, max-age=3600');
        headers.set('Access-Control-Allow-Origin', '*');
        headers.set('Access-Control-Allow-Methods', 'GET');
        headers.set('Access-Control-Allow-Headers', 'Content-Type');
        headers.set('X-Content-Type-Options', 'nosniff');

        return new NextResponse(imageBuffer, {
          status: 200,
          headers,
        });
      } catch (error) {
        console.error('Error fetching legacy image URL:', error);
        // Continue to fallback
      }
    }

    // Final fallback: Return error placeholder
    const errorSvg = `
      <svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="400" fill="#fef2f2"/>
        <text x="200" y="180" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#dc2626">
          Image Data Unavailable
        </text>
        <text x="200" y="200" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#991b1b">
          The image data could not be retrieved
        </text>
        <text x="200" y="220" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="#dc2626">
          Image ID: ${id}
        </text>
      </svg>
    `;

    return new NextResponse(errorSvg, {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Error serving image:', error);

    // Even in error cases, return a placeholder instead of JSON error
    const errorSvg = `
      <svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="400" fill="#fef2f2"/>
        <text x="200" y="180" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#dc2626">
          Server Error
        </text>
        <text x="200" y="200" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#991b1b">
          Failed to serve image
        </text>
        <text x="200" y="220" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="#dc2626">
          Please try again later
        </text>
      </svg>
    `;

    return new NextResponse(errorSvg, {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'no-cache',
      },
    });
  }
}
