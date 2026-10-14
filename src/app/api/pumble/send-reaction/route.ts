import { NextRequest, NextResponse } from 'next/server';
import { sendPumbleReactionApi } from '@/lib/pumble-service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, workspaceId, channelId, messageId, emoji } = body;

    if (!channelId || !emoji) {
      return NextResponse.json(
        { success: false, error: 'channelId and emoji are required' },
        { status: 400 }
      );
    }

    const activeToken = token || process.env.PUMBLE_BOT_TOKEN || '';
    const activeWs = workspaceId || process.env.PUMBLE_WORKSPACE_ID || 'ws_default';
    const targetMsgId = messageId || 'msg_' + Date.now();

    const result = await sendPumbleReactionApi(activeToken, activeWs, channelId, targetMsgId, emoji);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Server error' },
      { status: 500 }
    );
  }
}
