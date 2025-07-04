import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Handle cron job authentication
  if (request.nextUrl.pathname.startsWith('/api/cron/')) {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    // For Vercel cron jobs, check for the special header
    const cronHeader = request.headers.get('authorization');
    const vercelCronSecret = process.env.CRON_SECRET;
    
    if (cronHeader === `Bearer ${vercelCronSecret}` || 
        authHeader === `Bearer ${cronSecret}`) {
      return NextResponse.next();
    }
    
    // Allow requests from Vercel's cron service
    const userAgent = request.headers.get('user-agent');
    if (userAgent && userAgent.includes('vercel-cron')) {
      return NextResponse.next();
    }
    
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/cron/:path*'],
};
