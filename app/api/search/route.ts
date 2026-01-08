import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getApiKey } from '@/lib/cursor-api/storage';
import { CursorAPIClient } from '@/lib/cursor-api/client';

interface SearchResult {
  id: string;
  type: 'project' | 'feature' | 'agent';
  title: string;
  description?: string;
  status?: string;
  href: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ results: [] });
    }

    const searchTerm = query.trim().toLowerCase();
    const results: SearchResult[] = [];

    // Search projects
    const projects = await prisma.project.findMany({
      where: {
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { repositoryUrl: { contains: searchTerm, mode: 'insensitive' } },
          { description: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
      take: 5,
    });

    for (const project of projects) {
      results.push({
        id: project.id,
        type: 'project',
        title: project.name,
        description: project.description || project.repositoryUrl,
        href: `/projects/${project.id}`,
      });
    }

    // Search features
    const features = await prisma.feature.findMany({
      where: {
        OR: [
          { title: { contains: searchTerm, mode: 'insensitive' } },
          { description: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
      take: 5,
      include: {
        project: {
          select: {
            name: true,
          },
        },
      },
    });

    for (const feature of features) {
      results.push({
        id: feature.id,
        type: 'feature',
        title: feature.title,
        description: feature.description
          ? `${feature.project.name} • ${feature.description.substring(0, 100)}`
          : feature.project.name,
        status: feature.status,
        href: `/features/${feature.id}`,
      });
    }

    // Search agents (if API key is available)
    try {
      const apiKey = getApiKey();
      if (apiKey) {
        const client = new CursorAPIClient(apiKey);
        const agentsResponse = await client.listAgents({ limit: 50 });
        const agents = agentsResponse.agents || [];

        for (const agent of agents) {
          const agentTitle = agent.prompt
            ? agent.prompt.substring(0, 50)
            : `Agent ${agent.id}`;
          
          if (
            agentTitle.toLowerCase().includes(searchTerm) ||
            agent.id.toLowerCase().includes(searchTerm) ||
            agent.repository?.toLowerCase().includes(searchTerm)
          ) {
            results.push({
              id: agent.id,
              type: 'agent',
              title: agentTitle,
              description: agent.repository || `Status: ${agent.status}`,
              status: agent.status,
              href: `/agents/${agent.id}/conversation`,
            });

            if (results.filter((r) => r.type === 'agent').length >= 5) {
              break;
            }
          }
        }
      }
    } catch (error) {
      // Silently fail if API key is not available
      console.error('Error searching agents:', error);
    }

    // Sort results: features first, then projects, then agents
    results.sort((a, b) => {
      const typeOrder = { feature: 0, project: 1, agent: 2 };
      return typeOrder[a.type] - typeOrder[b.type];
    });

    return NextResponse.json({ results: results.slice(0, 20) });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Failed to perform search' },
      { status: 500 }
    );
  }
}

