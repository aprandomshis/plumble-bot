import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { token, workspaceId } = await req.json();

    const activeToken = token || process.env.PUMBLE_BOT_TOKEN;
    const activeWs = workspaceId || process.env.PUMBLE_WORKSPACE_ID;

    if (!activeToken || !activeWs) {
      return NextResponse.json(
        { success: false, error: 'Pumble Bot Token and Workspace ID are required' },
        { status: 400 }
      );
    }

    // Call Pumble API to get real channels
    const res = await fetch(`https://api.pumble.com/workspaces/${activeWs}/channels`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${activeToken}`,
      },
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json(
        { success: false, error: `Pumble API HTTP ${res.status}: ${err}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    const rawChannels = Array.isArray(data) ? data : data.channels || [];

    const formattedChannels = rawChannels.map((c: any) => ({
      id: c.id,
      name: c.name,
      type: c.type === 'dm' ? 'dm' : c.isPrivate ? 'group' : 'channel',
      isPrivate: Boolean(c.isPrivate),
      memberCount: c.membersCount || c.members?.length || 1,
      autoResponderEnabled: true,
      autoReactEnabled: true,
      welcomeMessageEnabled: false,
    }));

    return NextResponse.json({ success: true, channels: formattedChannels });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch channels from Pumble' },
      { status: 500 }
    );
  }
}
