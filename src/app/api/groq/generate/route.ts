import { NextRequest, NextResponse } from 'next/server';
import { generateGroqAutoReply } from '@/lib/groq';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      incomingMessage,
      senderName,
      channelName,
      systemPrompt,
      ruleInstruction,
      apiKey,
      model,
    } = body;

    if (!incomingMessage) {
      return NextResponse.json(
        { success: false, error: 'incomingMessage is required' },
        { status: 400 }
      );
    }

    const result = await generateGroqAutoReply({
      incomingMessage,
      senderName: senderName || 'User',
      channelName: channelName || 'general',
      systemPrompt,
      ruleInstruction,
      apiKey: apiKey || process.env.GROQ_API_KEY,
      model: model || process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to call Groq API' },
      { status: 500 }
    );
  }
}
