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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-api-key, X-Api-Key, X-API-Key',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400',
    },
  });
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
    
    // Validate repository URL format
    const repository = (body as any).repository;
    if (!repository || typeof repository !== 'string') {
      return NextResponse.json(
        { error: 'Repository URL is required' },
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
    
    console.log('Body after removing apiKey:', Object.keys(body));
    console.log('Proceeding with request to Cursor API');
    console.log('Repository:', repository);

    // Forward request to Cursor API
    // Cursor API uses Basic Auth with empty username and API key as password
    const authHeader = `Basic ${Buffer.from(`:${apiKey}`).toString('base64')}`;
    
    // Log the exact request we're sending
    const requestBody = JSON.stringify(body);
    console.log('Sending to Cursor API:');
    console.log('URL:', `${CURSOR_API_BASE_URL}/agents`);
    console.log('Method: POST');
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
      const data = await response.json();
      console.log('Cursor API response:', JSON.stringify(data, null, 2));
      
      if (!response.ok) {
        // Return more detailed error information
        return NextResponse.json(
          { 
            error: data.message || data.error || 'Failed to launch agent',
            code: data.code,
            details: data,
            suggestion: response.status === 401 
              ? 'Please check that your Cursor API key is correct and has not expired.'
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
