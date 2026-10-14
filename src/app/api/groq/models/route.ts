import { NextRequest, NextResponse } from 'next/server';
import { fetchLiveGroqModels } from '@/lib/groq';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const apiKey = searchParams.get('key') || process.env.GROQ_API_KEY;

    const models = await fetchLiveGroqModels(apiKey || undefined);
    return NextResponse.json({ success: true, models });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to fetch models' },
      { status: 500 }
    );
  }
}
