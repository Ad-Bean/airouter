import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma, withDatabaseRetry } from '@/lib/prisma';

// POST /api/chat/messages - Save a chat message
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId, role, content, type, imageUrls } = await request.json();

    // Wrap the entire database operation in retry logic
    const result = await withDatabaseRetry(async () => {
      // If no sessionId provided, create a new session
      let chatSessionId = sessionId;
      if (!chatSessionId) {
        // Generate title from first user message
        const title =
          role === 'user' && content
            ? content.length > 50
              ? content.substring(0, 50) + '...'
              : content
            : 'New Chat';

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
    console.error('Error saving chat message:', error);

    // Check if it's a Prisma connection error
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P5010') {
      return NextResponse.json(
        { error: 'Database temporarily unavailable. Message not saved.' },
        { status: 503 },
      );
    }

    return NextResponse.json({ error: 'Failed to save chat message' }, { status: 500 });
  }
}

// GET /api/chat/messages - Get messages for a session
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    const messages = await withDatabaseRetry(async () => {
      return await prisma.chatMessage.findMany({
        where: {
          sessionId,
          session: {
            userId: session.user.id,
          },
        },
        orderBy: { createdAt: 'asc' },
      });
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    return NextResponse.json({ error: 'Failed to fetch chat messages' }, { status: 500 });
  }
}
