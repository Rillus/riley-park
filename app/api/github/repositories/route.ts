import { NextRequest, NextResponse } from 'next/server';
import { Octokit } from '@octokit/rest';

interface Repository {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  private: boolean;
}

/**
 * GET /api/github/repositories
 * Fetch GitHub repositories for the authenticated user
 * Query params:
 *   - q: Search query (optional)
 *   - token: GitHub token (optional, uses env var if not provided)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const token = searchParams.get('token') || process.env.GITHUB_TOKEN;

    if (!token) {
      return NextResponse.json(
        { error: 'GitHub token is required' },
        { status: 401 }
      );
    }

    const octokit = new Octokit({ auth: token });

    // Get the authenticated user
    const { data: user } = await octokit.users.getAuthenticated();

    // Fetch user's repositories
    // For now, we'll fetch all repos and filter client-side
    // In a production app, you might want to implement server-side pagination
    const { data: repos } = await octokit.repos.listForAuthenticatedUser({
      per_page: 100,
      sort: 'updated',
      direction: 'desc',
    });

    // Filter repos by query if provided
    let filteredRepos = repos;
    if (query.trim()) {
      const searchTerm = query.toLowerCase();
      filteredRepos = repos.filter(
        (repo) =>
          repo.name.toLowerCase().includes(searchTerm) ||
          repo.full_name.toLowerCase().includes(searchTerm) ||
          (repo.description && repo.description.toLowerCase().includes(searchTerm))
      );
    }

    // Transform to our format
    const repositories: Repository[] = filteredRepos.map((repo) => ({
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      html_url: repo.html_url,
      description: repo.description,
      private: repo.private,
    }));

    return NextResponse.json({
      repositories: repositories.slice(0, 50), // Limit to 50 results
      total: repositories.length,
    });
  } catch (error) {
    console.error('Error fetching GitHub repositories:', error);
    
    if (error instanceof Error) {
      // Check if it's an authentication error
      if (error.message.includes('Bad credentials') || error.message.includes('401')) {
        return NextResponse.json(
          { error: 'Invalid GitHub token' },
          { status: 401 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to fetch GitHub repositories' },
      { status: 500 }
    );
  }
}
