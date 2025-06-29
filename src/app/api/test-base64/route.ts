import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log("Test API received:", {
      hasImageData: !!body.imageData,
      imageDataLength: body.imageData?.length || 0,
      imageDataType: typeof body.imageData,
      startsWithData: body.imageData?.startsWith?.("data:"),
      firstChars: body.imageData?.substring(0, 50),
    });

    // Test base64 processing
    let processedImageData: Buffer;
    let mimeType: string;

    if (body.imageData?.startsWith("data:")) {
      const [header, base64Data] = body.imageData.split(",");
      const mimeMatch = header.match(/data:([^;]+)/);
      mimeType = mimeMatch ? mimeMatch[1] : "image/png";
      processedImageData = Buffer.from(base64Data, "base64");
    } else {
      processedImageData = Buffer.from(body.imageData, "base64");
      mimeType = "image/png";
    }

    return NextResponse.json({
      success: true,
      processed: {
        originalLength: body.imageData?.length || 0,
        processedLength: processedImageData.length,
        mimeType: mimeType,
        isValidBuffer: Buffer.isBuffer(processedImageData),
      },
    });
  } catch (error) {
    console.error("Test API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
