import { NextRequest, NextResponse } from 'next/server';
import { refreshAccessToken } from '@/app/lib/auth/tokens';
import { getUser } from '@/app/lib/db/queries';
import { ActivityType } from '@/app/lib/db/schema';
import { getUserWithTeam } from '@/app/lib/db/queries';
import { db } from '@/app/lib/db/drizzle';
import { activityLogs } from '@/app/lib/db/schema';

async function logActivity(
  teamId: number | null | undefined,
  userId: number,
  type: ActivityType,
  ipAddress?: string
) {
  if (teamId === null || teamId === undefined) {
    return;
  }
  await db.insert(activityLogs).values({
    teamId,
    userId,
    action: type,
    ipAddress: ipAddress || ''
  });
}

export async function POST(request: NextRequest) {
  try {
    const newAccessToken = await refreshAccessToken();
    
    if (!newAccessToken) {
      return NextResponse.json(
        { error: 'Invalid or expired refresh token' },
        { status: 401 }
      );
    }

    // Log the token refresh activity
    const user = await getUser();
    if (user) {
      const userWithTeam = await getUserWithTeam(user.id);
      const clientIP = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown';
      
      await logActivity(userWithTeam?.teamId, user.id, ActivityType.REFRESH_TOKEN, clientIP);
    }

    return NextResponse.json({ 
      success: true,
      message: 'Access token refreshed successfully'
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    return NextResponse.json(
      { error: 'Token refresh failed' },
      { status: 500 }
    );
  }
}