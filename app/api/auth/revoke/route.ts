import { NextRequest, NextResponse } from 'next/server';
import { revokeAllUserRefreshTokens, clearTokens } from '@/app/lib/auth/tokens';
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
    const user = await getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    // Revoke all refresh tokens for the user
    await revokeAllUserRefreshTokens(user.id);
    
    // Clear current session tokens
    await clearTokens();

    // Log the revoke activity
    const userWithTeam = await getUserWithTeam(user.id);
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
    
    await logActivity(userWithTeam?.teamId, user.id, ActivityType.REVOKE_TOKEN, clientIP);

    return NextResponse.json({ 
      success: true,
      message: 'All tokens revoked successfully'
    });
  } catch (error) {
    console.error('Token revoke error:', error);
    return NextResponse.json(
      { error: 'Token revoke failed' },
      { status: 500 }
    );
  }
}