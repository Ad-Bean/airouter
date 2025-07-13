import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    console.log('=== TEST GENERATE DEBUG ===');
    console.log('Headers:', Object.fromEntries(request.headers.entries()));
    console.log('Cookies:', request.cookies.getAll());

    const session = await getServerSession(authOptions);
    console.log('Session from getServerSession:', JSON.stringify(session, null, 2));

    return NextResponse.json({
      hasSession: !!session,
      session,
      headers: Object.fromEntries(request.headers.entries()),
      cookies: request.cookies.getAll(),
    });
  } catch (error) {
    console.error('Test generate error:', error);
    return NextResponse.json(
      {
        error: 'Test failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
