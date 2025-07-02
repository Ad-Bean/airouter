import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma, withDatabaseRetry } from "@/lib/prisma";

// Helper function to sanitize provider data by removing large base64 images
function sanitizeProviderData(providerData: unknown): unknown {
  if (!providerData) return null;

  if (Array.isArray(providerData)) {
    return providerData.map(sanitizeProviderData);
  }

  if (typeof providerData === "object" && providerData !== null) {
    const sanitized = { ...(providerData as Record<string, unknown>) };

    // Remove large image data but keep metadata
    if (sanitized.images) {
      // Replace base64 images with just a count or reference
      sanitized.imageCount = Array.isArray(sanitized.images)
        ? sanitized.images.length
        : 0;
      delete sanitized.images; // Remove the actual base64 data
    }

    if (sanitized.displayUrls) {
      // Keep only the first few characters of each URL for reference
      sanitized.displayUrlCount = Array.isArray(sanitized.displayUrls)
        ? sanitized.displayUrls.length
        : 0;
      delete sanitized.displayUrls; // Remove the actual base64 data
    }

    // Recursively sanitize nested objects
    Object.keys(sanitized).forEach((key) => {
      if (typeof sanitized[key] === "object") {
        sanitized[key] = sanitizeProviderData(sanitized[key]);
      }
    });

    return sanitized;
  }

  return providerData;
}

// POST /api/chat/messages - Save a chat message
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sessionId, role, content, type, imageUrls, providerData } =
      await request.json();

    // Log the size of data being processed
    let sanitizedProviderData = null;
    if (providerData) {
      const originalSize = JSON.stringify(providerData).length;
      sanitizedProviderData = sanitizeProviderData(providerData);
      const sanitizedSize = JSON.stringify(sanitizedProviderData).length;
      console.log(
        `Provider data size reduced from ${originalSize} to ${sanitizedSize} bytes (${Math.round(
          ((originalSize - sanitizedSize) / originalSize) * 100
        )}% reduction)`
      );
    }

    // Wrap the entire database operation in retry logic
    const result = await withDatabaseRetry(async () => {
      // If no sessionId provided, create a new session
      let chatSessionId = sessionId;
      if (!chatSessionId) {
        // Generate title from first user message
        const title =
          role === "user" && content
            ? content.length > 50
              ? content.substring(0, 50) + "..."
              : content
            : "New Chat";

        const newSession = await prisma.chatSession.create({
          data: {
            userId: session.user.id,
            title,
          },
        });
        chatSessionId = newSession.id;
      }

      const message = await prisma.chatMessage.create({
        data: {
          sessionId: chatSessionId,
          role,
          content,
          type,
          imageUrls: imageUrls || [],
          // Use pre-calculated sanitized provider data
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          providerData: sanitizedProviderData as any,
        },
      });

      // Update session's updatedAt timestamp
      await prisma.chatSession.update({
        where: { id: chatSessionId },
        data: { updatedAt: new Date() },
      });

      return { message, sessionId: chatSessionId };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error saving chat message:", error);

    // Check if it's a Prisma connection error
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P5010"
    ) {
      return NextResponse.json(
        { error: "Database temporarily unavailable. Message not saved." },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Failed to save chat message" },
      { status: 500 }
    );
  }
}
