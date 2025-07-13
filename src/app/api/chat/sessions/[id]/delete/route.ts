import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma, withDatabaseRetry } from '@/lib/prisma';

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: sessionId } = await context.params;

    // Find the chat session and verify ownership
    const chatSession = await withDatabaseRetry(async () => {
      return await prisma.chatSession.findUnique({
        where: { id: sessionId },
        select: {
          id: true,
          userId: true,
          title: true,
        },
      });
    });

    if (!chatSession) {
      return NextResponse.json({ error: 'Chat session not found' }, { status: 404 });
    }

    if (chatSession.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Hard delete the chat session (this will cascade delete messages)
    await withDatabaseRetry(async () => {
      await prisma.chatSession.delete({
        where: { id: sessionId },
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Chat session deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting chat session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
