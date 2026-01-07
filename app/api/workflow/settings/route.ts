/**
 * Workflow Settings API
 * GET /api/workflow/settings - Get workflow settings
 * PUT /api/workflow/settings - Update workflow settings
 */

import { NextResponse } from 'next/server';
import {
  getWorkflowSettings,
  updateWorkflowSettings,
} from '@/lib/workflow/auto-transition';
import {
  MIN_POLLING_INTERVAL,
  MAX_POLLING_INTERVAL,
} from '@/lib/workflow/types';

export async function GET() {
  try {
    const settings = await getWorkflowSettings();
    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error fetching workflow settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workflow settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { autoTransition, pollingInterval } = body;

    // Validate polling interval
    if (pollingInterval !== undefined) {
      if (typeof pollingInterval !== 'number') {
        return NextResponse.json(
          { error: 'Polling interval must be a number' },
          { status: 400 }
        );
      }
      if (pollingInterval < MIN_POLLING_INTERVAL) {
        return NextResponse.json(
          { error: `Polling interval must be at least ${MIN_POLLING_INTERVAL}ms` },
          { status: 400 }
        );
      }
      if (pollingInterval > MAX_POLLING_INTERVAL) {
        return NextResponse.json(
          { error: `Polling interval must be at most ${MAX_POLLING_INTERVAL}ms` },
          { status: 400 }
        );
      }
    }

    // Validate auto-transition
    if (autoTransition !== undefined && typeof autoTransition !== 'boolean') {
      return NextResponse.json(
        { error: 'Auto-transition must be a boolean' },
        { status: 400 }
      );
    }

    const settings = await updateWorkflowSettings({
      autoTransition,
      pollingInterval,
    });

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error updating workflow settings:', error);
    return NextResponse.json(
      { error: 'Failed to update workflow settings' },
      { status: 500 }
    );
  }
}
