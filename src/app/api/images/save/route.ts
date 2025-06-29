import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { 
      prompt, 
      imageUrl, 
      provider, 
      model, 
      width, 
      height, 
      steps 
    } = await request.json();

    if (!prompt || !imageUrl || !provider) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const savedImage = await prisma.generatedImage.create({
      data: {
        userId: session.user.id,
        prompt,
        imageUrl,
        provider,
        model: model || null,
        width: width || 1024,
        height: height || 1024,
        steps: steps || 20,
      },
    });

    return NextResponse.json(
      { success: true, image: savedImage },
      { status: 201 }
    );
  } catch (error) {
    console.error("Save image error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
