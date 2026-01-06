import { NextResponse } from 'next/server';
import { readFeatureFile } from '@/lib/features/parser';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const feature = readFeatureFile(id);
    
    if (!feature) {
      return NextResponse.json(
        { error: 'Feature not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ feature });
  } catch (error) {
    console.error('Error fetching feature:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feature' },
      { status: 500 }
    );
  }
}

