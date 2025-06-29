import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const image = await prisma.generatedImage.findUnique({
      where: { id },
      select: {
        imageData: true,
        mimeType: true,
        filename: true,
        imageUrl: true,
        isPublic: true,
        userId: true,
      },
    });

    if (!image) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    // If we have binary data stored, serve it directly
    if (image.imageData && image.mimeType) {
      const headers = new Headers();
      headers.set("Content-Type", image.mimeType);
      headers.set("Cache-Control", "public, max-age=31536000, immutable");

      if (image.filename) {
        headers.set(
          "Content-Disposition",
          `inline; filename="${image.filename}"`
        );
      }

      return new NextResponse(image.imageData, {
        status: 200,
        headers,
      });
    }

    // Fallback to legacy imageUrl if no binary data
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
