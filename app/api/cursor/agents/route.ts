import { NextRequest, NextResponse } from 'next/server';

const CURSOR_API_BASE_URL = 'https://api.cursor.com/v0';

/**
 * Handle CORS preflight requests
 */
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin') || '*';
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-api-key, X-Api-Key, X-API-Key',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400',
    },
  });
}

/**
 * Proxy route for listing agents
 * GET /api/cursor/agents
 */
export async function GET(request: NextRequest) {
  try {
    // Get API key from query string (for GET requests) or headers
    const searchParams = request.nextUrl.searchParams;
    const apiKey = searchParams.get('apiKey') || 
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

    // Forward query parameters to Cursor API
    const limit = searchParams.get('limit');
    const cursor = searchParams.get('cursor');
    let cursorApiUrl = `${CURSOR_API_BASE_URL}/agents`;
    const cursorParams = new URLSearchParams();
    if (limit) cursorParams.append('limit', limit);
    if (cursor) cursorParams.append('cursor', cursor);
    if (cursorParams.toString()) {
      cursorApiUrl += `?${cursorParams.toString()}`;
    }

    // Forward request to Cursor API
    const response = await fetch(cursorApiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Failed to list agents', details: data },
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
    console.error('Error listing agents:', error);
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
 * Proxy route for launching agents
 * POST /api/cursor/agents
 */
export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch (e) {
      console.error('Failed to parse request body:', e);
      return NextResponse.json(
        { error: 'Invalid request body' },
        { 
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }
    
    console.log('=== API Route Called ===');
    console.log('Body keys:', Object.keys(body));
    console.log('Body has apiKey:', !!(body as any).apiKey);
    
    // Get API key from request body (more reliable than headers)
    const apiKey = (body as any).apiKey;
    
    if (!apiKey) {
      console.error('Missing API key in request body');
      console.error('Body content:', JSON.stringify(body, null, 2));
      return NextResponse.json(
        { error: 'API key is required. Please set your Cursor API key in settings.' },
        { 
          status: 401,
          headers: {
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }
    
    console.log('API key found:', '***' + apiKey.slice(-4));
    console.log('API key length:', apiKey.length);
    console.log('API key starts with:', apiKey.substring(0, 10) + '...');
    
    // Validate repository URL format
    // Repository is now nested in source.repository (after fixing the request structure)
    const source = (body as any).source;
    const repository = source?.repository;
    
    console.log('Source object:', JSON.stringify(source, null, 2));
    console.log('Repository from source:', repository);
    
    if (!repository || typeof repository !== 'string') {
      console.error('Missing repository in source object. Body structure:', JSON.stringify(body, null, 2));
      return NextResponse.json(
        { error: 'Repository URL is required in source.repository' },
        { 
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // Basic validation: should be a GitHub/GitLab URL
    const repoUrlPattern = /^https?:\/\/(github\.com|gitlab\.com|bitbucket\.org)\/[^\/]+\/[^\/]+/i;
    if (!repoUrlPattern.test(repository)) {
      return NextResponse.json(
        { error: 'Invalid repository URL format. Must be a GitHub, GitLab, or Bitbucket URL.' },
        { 
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }
    
    // Remove apiKey from body before forwarding to Cursor API
    delete (body as any).apiKey;
    
    console.log('Body after removing apiKey:', JSON.stringify(body, null, 2));
    console.log('Proceeding with request to Cursor API');
    console.log('Repository:', repository);

    // Forward request to Cursor API
    // Cursor API uses Basic Auth with API key as username and empty password
    // Format: Basic base64(apiKey:)
    // This matches curl: -u YOUR_API_KEY:
    const credentials = `${apiKey}:`;
    const base64Credentials = Buffer.from(credentials).toString('base64');
    const authHeader = `Basic ${base64Credentials}`;
    
    // Log the exact request we're sending
    const requestBody = JSON.stringify(body);
    console.log('=== Sending to Cursor API ===');
    console.log('URL:', `${CURSOR_API_BASE_URL}/agents`);
    console.log('Method: POST');
    console.log('Credentials format:', `${apiKey.substring(0, 10)}...:`);
    console.log('Base64 credentials (first 30 chars):', base64Credentials.substring(0, 30) + '...');
    console.log('Auth header (first 30 chars):', authHeader.substring(0, 30) + '...');
    console.log('Request body:', requestBody);
    
    try {
      const response = await fetch(`${CURSOR_API_BASE_URL}/agents`, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: requestBody,
      });

      console.log('Cursor API response status:', response.status);
      
      // Try to get response text first to see if it's valid JSON
      const responseText = await response.text();
      console.log('Cursor API raw response:', responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
        console.log('Cursor API parsed response:', JSON.stringify(data, null, 2));
      } catch (e) {
        console.error('Failed to parse response as JSON:', e);
        data = { error: responseText };
      }
      
      if (!response.ok) {
        // For 401, also test the API key with a simpler endpoint
        if (response.status === 401) {
          console.log('Testing API key with /v0/me endpoint...');
          try {
            // Use the same auth format for testing
            const testAuthHeader = `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`;
            const testResponse = await fetch(`${CURSOR_API_BASE_URL}/me`, {
              method: 'GET',
              headers: {
                'Authorization': testAuthHeader,
              },
            });
            const testData = await testResponse.json().catch(() => ({}));
            console.log('API key test (/v0/me) status:', testResponse.status);
            console.log('API key test response:', testData);
          } catch (testError) {
            console.error('Error testing API key:', testError);
          }
        }
        
        // Return more detailed error information
        return NextResponse.json(
          { 
            error: data.message || data.error || 'Failed to launch agent',
            code: data.code,
            details: data,
            rawResponse: responseText,
            suggestion: response.status === 401 
              ? 'Please check that your Cursor API key is correct and has not expired. You can test it at /api/test-cursor-api?apiKey=YOUR_KEY'
              : response.status === 400
              ? 'Please check that the repository URL is correct and accessible.'
              : 'Please try again or check the Cursor API status.'
          },
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
    } catch (fetchError) {
      console.error('Error calling Cursor API:', fetchError);
      return NextResponse.json(
        { 
          error: 'Failed to connect to Cursor API',
          details: fetchError instanceof Error ? fetchError.message : 'Unknown error'
        },
        { 
          status: 500,
          headers: {
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }
  } catch (error) {
    console.error('Error launching agent:', error);
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
