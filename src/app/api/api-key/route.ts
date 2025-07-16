import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { createApiKey, getUserApiKeys } from '@/lib/api-key';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name } = await request.json();

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'API key name is required' }, { status: 400 });
    }

    // Check if user has too many API keys (limit to 10)
    const existingKeys = await getUserApiKeys(session.user.id);
    if (existingKeys.length >= 10) {
      return NextResponse.json(
        { error: 'Maximum number of API keys reached (10)' },
        { status: 400 },
      );
    }

    // Create new API key
    const apiKey = await createApiKey(session.user.id, name.trim());

    return NextResponse.json({
      success: true,
      apiKey,
      message: "API key created successfully. Keep this key secure - it won't be shown again.",
    });
  } catch (error) {
    console.error('Error creating API key:', error);
    return NextResponse.json({ error: 'Failed to create API key' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all API keys for user (without exposing the actual key)
    const apiKeys = await getUserApiKeys(session.user.id);

    const safeApiKeys = apiKeys.map((key) => ({
      id: key.id,
      name: key.name,
      keyPreview: `${key.key.substring(0, 8)}...`,
      lastUsed: key.lastUsed,
      usageCount: key.usageCount,
      isActive: key.isActive,
      createdAt: key.createdAt,
    }));

    return NextResponse.json({
      apiKeys: safeApiKeys,
    });
  } catch (error) {
    console.error('Error getting API keys:', error);
    return NextResponse.json({ error: 'Failed to get API keys' }, { status: 500 });
  }
}
