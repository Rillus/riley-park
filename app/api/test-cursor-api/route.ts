import { NextRequest, NextResponse } from 'next/server';

const CURSOR_API_BASE_URL = 'https://api.cursor.com/v0';

/**
 * Test endpoint to verify Cursor API key and connection
 * GET /api/test-cursor-api?apiKey=your-key
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const apiKey = searchParams.get('apiKey');
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required as query parameter' },
        { status: 400 }
      );
    }

    // Test 1: Try to list repositories (simpler endpoint)
    console.log('Testing Cursor API with key ending in:', apiKey.slice(-4));
    
    try {
      // Cursor API uses Basic Auth with API key as username and empty password
      // Format: Basic base64(apiKey:)
      const reposResponse = await fetch(`${CURSOR_API_BASE_URL}/repositories`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`,
        },
      });

      console.log('Repositories endpoint status:', reposResponse.status);
      const reposData = await reposResponse.json().catch(() => ({}));
      console.log('Repositories response:', reposData);

      if (reposResponse.ok) {
        return NextResponse.json({
          success: true,
          message: 'API key is valid!',
          repositories: reposData,
        });
      }

      return NextResponse.json({
        success: false,
        status: reposResponse.status,
        error: reposData,
        message: reposResponse.status === 401 
          ? 'API key authentication failed. Please check your API key.'
          : `API returned status ${reposResponse.status}`,
      });
    } catch (error) {
      console.error('Error testing repositories endpoint:', error);
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in test endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

