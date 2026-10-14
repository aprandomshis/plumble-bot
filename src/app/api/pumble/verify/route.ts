import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { token, workspaceId } = await req.json();

    if (!token) {
      // In simulator / demo mode, verification succeeds with note
      return NextResponse.json({
        success: true,
        mode: 'simulator',
        message: 'Running in Local Simulator mode. To connect to live Pumble workspace, enter a Bot Token.',
      });
    }

    // Call Pumble API to verify credentials
    const targetWs = workspaceId || 'default';
    const response = await fetch(`https://api.pumble.com/workspaces/${targetWs}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json({
        success: true,
        mode: 'live',
        workspace: data,
      });
    } else {
      // Return details
      return NextResponse.json({
        success: false,
        error: `Pumble API rejected credentials (HTTP ${response.status})`,
      });
    }
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err?.message || 'Failed to connect to Pumble API',
    });
  }
}
