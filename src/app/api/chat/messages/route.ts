import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/chat/messages - Save a chat message
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sessionId, role, content, type, imageUrls, providerData } =
      await request.json();

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
        providerData: providerData || null,
      },
    });

    // Update session's updatedAt timestamp
    await prisma.chatSession.update({
      where: { id: chatSessionId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({ message, sessionId: chatSessionId });
  } catch (error) {
    console.error("Error saving chat message:", error);
    return NextResponse.json(
      { error: "Failed to save chat message" },
      { status: 500 }
    );
  }
}
