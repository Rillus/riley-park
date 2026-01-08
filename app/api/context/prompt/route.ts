/**
 * API Route for Context Prompt Generation
 * 
 * POST /api/context/prompt - Generate context prompt for agent launch
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateContextPrompt, ContextPromptOptions } from '@/lib/context/prompt-generator';

/**
 * POST /api/context/prompt
 * Generate context prompt for agent launch
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const options: ContextPromptOptions = {
      projectId: body.projectId,
      featureId: body.featureId,
      includeProjectContext: body.includeProjectContext !== false,
      includeFeatureContext: body.includeFeatureContext !== false,
      includeContextTypes: body.includeContextTypes,
      maxTokens: body.maxTokens || 8000,
    };

    const result = await generateContextPrompt(options);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error generating context prompt:', error);
    return NextResponse.json(
      { error: 'Failed to generate context prompt' },
      { status: 500 }
    );
  }
}

