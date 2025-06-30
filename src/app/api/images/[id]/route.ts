import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    let image;
    try {
      image = await prisma.generatedImage.findUnique({
        where: { id },
        select: {
          s3Url: true,
          s3Key: true,
          s3Bucket: true,
          imagePath: true,
          mimeType: true,
          filename: true,
          imageUrl: true,
          isPublic: true,
          userId: true,
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

    if (!image) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    // Priority 1: S3 URL (proxy through our API for proper auth)
    if (image.s3Key && image.s3Bucket) {
      try {
        // Initialize S3 client with credentials
        const s3Client = new S3Client({
          region: process.env.AWS_REGION || "us-east-1",
          credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
          },
        });

        const command = new GetObjectCommand({
          Bucket: image.s3Bucket,
          Key: image.s3Key,
        });

        const response = await s3Client.send(command);

        if (response.Body) {
          const headers = new Headers();
          headers.set("Content-Type", image.mimeType || "image/png");
          headers.set("Cache-Control", "public, max-age=31536000, immutable");

          if (image.filename) {
            headers.set(
              "Content-Disposition",
              `inline; filename="${image.filename}"`
            );
          }

          // Convert the S3 response stream to buffer
          const streamToBuffer = async (
            stream: NodeJS.ReadableStream
          ): Promise<Buffer> => {
            const chunks: Uint8Array[] = [];
            return new Promise((resolve, reject) => {
              stream.on("data", (chunk: Uint8Array) => chunks.push(chunk));
              stream.on("error", reject);
              stream.on("end", () => resolve(Buffer.concat(chunks)));
            });
          };

          const imageBuffer = await streamToBuffer(
            response.Body as NodeJS.ReadableStream
          );

          return new NextResponse(new Uint8Array(imageBuffer), {
            status: 200,
            headers,
          });
        }
      } catch (s3Error) {
        console.error("Error fetching from S3:", s3Error);
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
