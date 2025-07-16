import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { deleteApiKey } from '@/lib/api-key';

export async function DELETE(request: Request) {
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

    // Delete API key
    await deleteApiKey(session.user.id, apiKeyId);

    return NextResponse.json({
      success: true,
      message: 'API key deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting API key:', error);
    return NextResponse.json({ error: 'Failed to delete API key' }, { status: 500 });
  }
}
