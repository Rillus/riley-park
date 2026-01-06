import { NextRequest, NextResponse } from 'next/server';

const CURSOR_API_BASE_URL = 'https://api.cursor.com/v0';

/**
 * Proxy route for getting agent status
 * GET /api/cursor/agents/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Try both lowercase and original case for header name
    const apiKey = request.headers.get('x-api-key') || request.headers.get('X-Api-Key');
    
    if (!apiKey) {
      console.error('Missing API key. Headers:', Object.fromEntries(request.headers.entries()));
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Forward request to Cursor API
    const response = await fetch(`${CURSOR_API_BASE_URL}/agents/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${Buffer.from(`:${apiKey}`).toString('base64')}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Failed to get agent status', details: data },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error getting agent status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

