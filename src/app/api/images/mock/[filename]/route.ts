import { NextRequest, NextResponse } from "next/server";

// Mock image endpoint for development when S3 is not configured
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ filename: string }> }
) {
  try {
    const params = await context.params;

    // Return a simple SVG placeholder image for development
    const svg = `
      <svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="400" fill="#f3f4f6"/>
        <text x="200" y="180" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#6b7280">
          Mock Image
        </text>
        <text x="200" y="200" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#9ca3af">
          ${params.filename}
        </text>
        <text x="200" y="220" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="#d1d5db">
          (S3 not configured)
        </text>
      </svg>
    `;

    return new NextResponse(svg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=31536000",
      },
    });
  } catch (error) {
    console.error("Error serving mock image:", error);
    return NextResponse.json(
      { error: "Failed to serve mock image" },
      { status: 500 }
    );
  }
}
