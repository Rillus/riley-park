/**
 * Workflow Monitor API
 * GET /api/workflow/monitor - Get monitor status
 * POST /api/workflow/monitor - Start/stop/restart monitor
 */

import { NextResponse } from 'next/server';
import {
  getWorkflowMonitor,
  destroyWorkflowMonitor,
  getActiveWorkflowSteps,
} from '@/lib/workflow/monitoring';
import { getWorkflowSettings } from '@/lib/workflow/auto-transition';

// Store monitor instance reference
let monitorApiKey: string | null = null;

export async function GET() {
  try {
    const settings = await getWorkflowSettings();
    const activeSteps = await getActiveWorkflowSteps();

    // Check if monitor is running
    const isRunning = monitorApiKey !== null;

    return NextResponse.json({
      status: isRunning ? 'running' : 'stopped',
      pollingInterval: settings.pollingInterval,
      autoTransition: settings.autoTransition,
      activeStepsCount: activeSteps.length,
      activeSteps: activeSteps.map((s) => ({
        id: s.id,
        stepType: s.stepType,
        agentId: s.agentId,
        featureId: s.featureId,
        featureTitle: s.feature?.title,
      })),
    });
  } catch (error) {
    console.error('Error fetching monitor status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch monitor status' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, apiKey } = body;

    switch (action) {
      case 'start': {
        if (!apiKey) {
          return NextResponse.json(
            { error: 'API key is required to start monitor' },
            { status: 400 }
          );
        }

        const settings = await getWorkflowSettings();
        const monitor = getWorkflowMonitor(apiKey, settings.pollingInterval);

        if (monitor.isRunning()) {
          return NextResponse.json({
            success: false,
            message: 'Monitor is already running',
            status: 'running',
          });
        }

        monitor.start();
        monitorApiKey = apiKey;

        return NextResponse.json({
          success: true,
          message: 'Monitor started',
          status: 'running',
        });
      }

      case 'stop': {
        destroyWorkflowMonitor();
        monitorApiKey = null;

        return NextResponse.json({
          success: true,
          message: 'Monitor stopped',
          status: 'stopped',
        });
      }

      case 'restart': {
        if (!apiKey && !monitorApiKey) {
          return NextResponse.json(
            { error: 'API key is required to restart monitor' },
            { status: 400 }
          );
        }

        const key = apiKey || monitorApiKey;
        destroyWorkflowMonitor();

        const settings = await getWorkflowSettings();
        const monitor = getWorkflowMonitor(key!, settings.pollingInterval);
        monitor.start();
        monitorApiKey = key;

        return NextResponse.json({
          success: true,
          message: 'Monitor restarted',
          status: 'running',
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use start, stop, or restart' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error controlling monitor:', error);
    return NextResponse.json(
      { error: 'Failed to control monitor' },
      { status: 500 }
    );
  }
}
