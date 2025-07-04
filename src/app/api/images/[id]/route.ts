import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { refreshSignedUrl } from "@/lib/s3";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
        },
      });
    } catch (dbError) {
      console.error("Database error when fetching image:", dbError);

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
          "Content-Type": "image/svg+xml",
          "Cache-Control": "no-cache",
        },
      });
    }

    if (!image || image.deleted) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    // Check authorization (unless image is public)
    if (!image.isPublic) {
      if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      
      // Check if user owns the image
      if (session.user.id !== image.userId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
        return NextResponse.redirect(signedUrl);
      } catch (s3Error) {
        console.error("Error with S3 signed URL:", s3Error);
        // Continue to fallback methods
      }
    }

    // Priority 2: Local file system (fallback)
    if (image.imagePath && image.mimeType) {
      // Serve from local file system
      try {
        const fs = await import("fs/promises");
        const path = await import("path");
        const filePath = path.join(process.cwd(), "public", image.imagePath);
        const fileBuffer = await fs.readFile(filePath);

        const headers = new Headers();
        headers.set("Content-Type", image.mimeType);
        headers.set("Cache-Control", "public, max-age=31536000, immutable");

        if (image.filename) {
          headers.set(
            "Content-Disposition",
            `inline; filename="${image.filename}"`
          );
        }

        return new NextResponse(new Uint8Array(fileBuffer), {
          status: 200,
          headers,
        });
      } catch (fileError) {
        console.error("Error reading local file:", fileError);
        // Continue to next fallback
      }
    }

    // Priority 3: Legacy imageUrl
    if (image.imageUrl) {
      return NextResponse.redirect(image.imageUrl);
    }

    return NextResponse.json(
      { error: "Image data not available" },
      { status: 404 }
    );
  } catch (error) {
    console.error("Error serving image:", error);
    return NextResponse.json(
      { error: "Failed to serve image" },
      { status: 500 }
    );
  }
}
