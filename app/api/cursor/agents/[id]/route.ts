import { NextRequest, NextResponse } from 'next/server';

const CURSOR_API_BASE_URL = 'https://api.cursor.com/v0';

/**
 * Handle CORS preflight requests
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-api-key, X-Api-Key, X-API-Key',
      'Access-Control-Max-Age': '86400',
    },
  });
}

/**
 * Proxy route for getting agent status
 * GET /api/cursor/agents/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get API key from query string (for GET requests) or headers
    const searchParams = request.nextUrl.searchParams;
    const apiKey = searchParams.get('apiKey') || 
                   request.headers.get('x-api-key') || 
                   request.headers.get('X-Api-Key');
    
    if (!apiKey) {
      console.error('Missing API key. Query params:', Object.fromEntries(searchParams.entries()));
      console.error('Headers:', Object.fromEntries(request.headers.entries()));
      return NextResponse.json(
        { error: 'API key is required' },
        { 
          status: 401,
          headers: {
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    const { id } = await params;

    // Forward request to Cursor API
    // Cursor API uses Basic Auth with API key as username and empty password
    // Format: Basic base64(apiKey:)
    const response = await fetch(`${CURSOR_API_BASE_URL}/agents/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Failed to get agent status', details: data },
        { 
          status: response.status,
          headers: {
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Error getting agent status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
}

/**
 * Proxy route for deleting an agent
 * DELETE /api/cursor/agents/[id]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    let body: Record<string, unknown> = {};
    try {
      body = await request.json();
    } catch {
      // Body might be empty for DELETE requests
    }
    
    // Get API key from body or headers
    const apiKey = (body as { apiKey?: string }).apiKey ||
                   request.headers.get('x-api-key') ||
                   request.headers.get('X-Api-Key');
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { 
          status: 401,
          headers: {
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    const { id } = await params;

    // Forward request to Cursor API
    const response = await fetch(`${CURSOR_API_BASE_URL}/agents/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`,
      },
    });

    // Handle 204 No Content response
    if (response.status === 204) {
      return NextResponse.json(
        { success: true },
        {
          headers: {
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Failed to delete agent', details: data },
        { 
          status: response.status,
          headers: {
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    return NextResponse.json(
      { success: true, ...data },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    console.error('Error deleting agent:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
}

