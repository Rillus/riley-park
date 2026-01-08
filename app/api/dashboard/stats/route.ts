import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getApiKey } from '@/lib/cursor-api/storage';
import { CursorAPIClient } from '@/lib/cursor-api/client';

export async function GET() {
  try {
    // Fetch projects count
    const projectsCount = await prisma.project.count();

    // Fetch features count (in progress)
    const featuresInProgress = await prisma.feature.count({
      where: {
        status: {
          in: ['in_progress', 'pending'],
        },
      },
    });

    // Fetch total features count
    const totalFeatures = await prisma.feature.count();

    // Fetch active agents count
    let activeAgentsCount = 0;
    try {
      const apiKey = getApiKey();
      if (apiKey) {
        const client = new CursorAPIClient(apiKey);
        const agents = await client.listAgents({ limit: 100 });
        activeAgentsCount = agents.agents?.filter(
          (agent) => agent.status === 'running' || agent.status === 'pending'
        ).length || 0;
      }
    } catch (error) {
      // If API key is not set or there's an error, just return 0
      console.error('Error fetching agents:', error);
    }

    // Fetch recent activity (last 10 features updated)
    const recentFeatures = await prisma.feature.findMany({
      take: 10,
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        status: true,
        updatedAt: true,
        project: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      stats: {
        activeAgents: activeAgentsCount,
        projects: projectsCount,
        featuresInProgress,
        totalFeatures,
      },
      recentActivity: recentFeatures.map((feature) => ({
        id: feature.id,
        title: feature.title,
        status: feature.status,
        updatedAt: feature.updatedAt.toISOString(),
        projectName: feature.project.name,
      })),
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}

