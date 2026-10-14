import { NextRequest, NextResponse } from 'next/server';
import { generateGroqEmojiReactions } from '@/lib/groq';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { incomingMessage, senderName, apiKey, model } = body;

    if (!incomingMessage) {
      return NextResponse.json(
        { success: false, error: 'incomingMessage is required' },
        { status: 400 }
      );
    }

    const result = await generateGroqEmojiReactions({
      incomingMessage,
      senderName: senderName || 'User',
      apiKey: apiKey || process.env.GROQ_API_KEY,
      model: model || process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to generate reactions' },
      { status: 500 }
    );
  }
}
