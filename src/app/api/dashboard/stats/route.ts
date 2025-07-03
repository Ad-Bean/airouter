import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    try {
      await prisma.$connect();
    } catch (dbError) {
      throw dbError;
    }

    const [totalImages, favoriteImages, recentImages, providerStats] =
      await Promise.all([
        prisma.generatedImage.count({
          where: { userId },
        }),

        prisma.generatedImage.count({
          where: {
            userId,
            isFavorite: true,
          },
        }),

        prisma.generatedImage.count({
          where: {
            userId,
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            },
          },
        }),

        prisma.generatedImage.groupBy({
          by: ["provider"],
          where: { userId },
          _count: {
            id: true,
          },
        }),
      ]);

    // Get recent images for dashboard preview
    const recentImagesList = await prisma.generatedImage.findMany({
      where: { userId },
      select: {
        id: true,
        prompt: true,
        provider: true,
        createdAt: true,
        // S3 storage fields
        s3Url: true,
        s3Key: true,
        s3Bucket: true,
        // Legacy storage fields
        imageUrl: true,
        imagePath: true,
      },
      orderBy: { createdAt: "desc" },
      take: 6,
    });

    const response = {
      totalImages,
      favoriteImages,
      recentImages,
      providerStats: providerStats.reduce(
        (
          acc: Record<string, number>,
          stat: { provider: string; _count: { id: number } }
        ) => {
          acc[stat.provider] = stat._count.id;
          return acc;
        },
        {} as Record<string, number>
      ),
      recentImagesList,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
