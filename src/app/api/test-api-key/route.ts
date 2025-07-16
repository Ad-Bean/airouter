import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const apiKey = searchParams.get('apiKey');

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required as query parameter' },
        { status: 400 },
      );
    }

    // Test the API key validation
    const testResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/v1/generate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: 'Test prompt for API validation',
        models: ['openai:dall-e-2'], // Using cheaper model for testing
        imageCount: 1,
      }),
    });

    const result = await testResponse.json();

    return NextResponse.json({
      success: true,
      apiKeyValid: testResponse.ok,
      status: testResponse.status,
      response: result,
    });
  } catch (error) {
    console.error('Error testing API key:', error);
    return NextResponse.json({ error: 'Failed to test API key' }, { status: 500 });
  }
}
