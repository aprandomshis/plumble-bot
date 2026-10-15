import { NextResponse } from 'next/server';

export async function GET() {
  // Return environment configuration from Vercel/server if available
  const workspaceId = process.env.PUMBLE_WORKSPACE_ID || '';
  const botToken = process.env.PUMBLE_BOT_TOKEN || '';
  const groqApiKey = process.env.GROQ_API_KEY || '';
  const groqModel = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
  const signingSecret = process.env.PUMBLE_SIGNING_SECRET || '';

  return NextResponse.json({
    configuredOnServer: Boolean(workspaceId || botToken || groqApiKey),
    workspaceId,
    hasBotToken: Boolean(botToken),
    hasGroqKey: Boolean(groqApiKey),
    groqModel,
    hasSigningSecret: Boolean(signingSecret),
  });
}
