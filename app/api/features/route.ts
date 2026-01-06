import { NextResponse } from 'next/server';
import { readFeatureFiles } from '@/lib/features/parser';

export async function GET() {
  try {
    const features = readFeatureFiles();
    return NextResponse.json({ features });
  } catch (error) {
    console.error('Error fetching features:', error);
    return NextResponse.json(
      { error: 'Failed to fetch features' },
      { status: 500 }
    );
  }
}

