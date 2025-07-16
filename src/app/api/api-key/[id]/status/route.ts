import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { updateApiKeyStatus } from '@/lib/api-key';

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const apiKeyId = searchParams.get('id');
    const { isActive } = await request.json();

    if (!apiKeyId) {
      return NextResponse.json({ error: 'API key ID is required' }, { status: 400 });
    }

    if (typeof isActive !== 'boolean') {
      return NextResponse.json({ error: 'isActive must be a boolean' }, { status: 400 });
    }

    // Update API key status
    await updateApiKeyStatus(session.user.id, apiKeyId, isActive);

    return NextResponse.json({
      success: true,
      message: `API key ${isActive ? 'activated' : 'deactivated'} successfully`,
    });
  } catch (error) {
    console.error('Error updating API key:', error);
    return NextResponse.json({ error: 'Failed to update API key' }, { status: 500 });
  }
}
