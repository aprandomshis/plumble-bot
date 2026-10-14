import { NextRequest, NextResponse } from 'next/server';
import { sendPumbleMessageApi } from '@/lib/pumble-service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, workspaceId, channelId, text } = body;

    if (!channelId || !text) {
      return NextResponse.json(
        { success: false, error: 'channelId and text are required' },
        { status: 400 }
      );
    }

    const activeToken = token || process.env.PUMBLE_BOT_TOKEN || '';
    const activeWs = workspaceId || process.env.PUMBLE_WORKSPACE_ID || 'ws_default';

    const result = await sendPumbleMessageApi(activeToken, activeWs, channelId, text);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Server error' },
      { status: 500 }
    );
  }
}
