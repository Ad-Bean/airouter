import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    // Also check what's in the database
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
      take: 5,
    });

    const sessions = await prisma.session.findMany({
      select: {
        id: true,
        userId: true,
        expires: true,
        sessionToken: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      take: 5,
    });

    return NextResponse.json({
      session,
      hasSession: !!session,
      hasUser: !!session?.user,
      hasUserId: !!session?.user?.id,
      hasUserEmail: !!session?.user?.email,
      userId: session?.user?.id,
      userEmail: session?.user?.email,
      dbUsers: users,
      dbSessions: sessions,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Session check failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
