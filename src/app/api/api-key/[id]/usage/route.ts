import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getApiKeyUsage } from '@/lib/api-key';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const apiKeyId = searchParams.get('id');

    if (!apiKeyId) {
      return NextResponse.json({ error: 'API key ID is required' }, { status: 400 });
    }

    // Get API key usage
    const usage = await getApiKeyUsage(session.user.id, apiKeyId);

    if (!usage) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 });
    }

    return NextResponse.json(usage);
  } catch (error) {
    console.error('Error getting API key usage:', error);
    return NextResponse.json({ error: 'Failed to get API key usage' }, { status: 500 });
  }
}
