import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { isFavorite } = await request.json();
    const imageId = params.id;

    if (typeof isFavorite !== "boolean") {
      return NextResponse.json(
        { error: "isFavorite must be a boolean" },
        { status: 400 }
      );
    }

    // Verify ownership and update
    const updatedImage = await prisma.generatedImage.updateMany({
      where: {
        id: imageId,
        userId: session.user.id,
      },
      data: {
        isFavorite,
      },
    });

    if (updatedImage.count === 0) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update favorite error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
