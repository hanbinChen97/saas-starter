import { desc, and, eq, isNull, lt, count } from 'drizzle-orm';
import { db } from './drizzle';
import { activityLogs, teamMembers, teams, users, appointmentProfiles } from './schema';
import { cookies } from 'next/headers';
import { verifyToken, updateUserActivity } from '@/app/lib/auth/session';

export async function getUser() {
  const sessionCookie = (await cookies()).get('session');
  if (!sessionCookie || !sessionCookie.value) {
    return null;
  }

  const sessionData = await verifyToken(sessionCookie.value);
  if (
    !sessionData ||
    !sessionData.user ||
    typeof sessionData.user.id !== 'number'
  ) {
    return null;
  }

  if (new Date(sessionData.expires) < new Date()) {
    return null;
  }

  const user = await db
    .select()
    .from(users)
    .where(and(eq(users.id, sessionData.user.id), isNull(users.deletedAt)))
    .limit(1);

  if (user.length === 0) {
    return null;
  }

  // Update user activity when successfully retrieving user
  updateUserActivity(sessionData.user.id);

  return user[0];
}

export async function getTeamByStripeCustomerId(customerId: string) {
  const result = await db
    .select()
    .from(teams)
    .where(eq(teams.stripeCustomerId, customerId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function updateTeamSubscription(
  teamId: number,
  subscriptionData: {
    stripeSubscriptionId: string | null;
    stripeProductId: string | null;
    planName: string | null;
    subscriptionStatus: string;
  }
) {
  await db
    .update(teams)
    .set({
      ...subscriptionData,
      updatedAt: new Date()
    })
    .where(eq(teams.id, teamId));
}

export async function getUserWithTeam(userId: number) {
  const result = await db
    .select({
      user: users,
      teamId: teamMembers.teamId
    })
    .from(users)
    .leftJoin(teamMembers, eq(users.id, teamMembers.userId))
    .where(eq(users.id, userId))
    .limit(1);

  return result[0];
}

export async function getActivityLogs() {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  return await db
    .select({
      id: activityLogs.id,
      action: activityLogs.action,
      timestamp: activityLogs.timestamp,
      ipAddress: activityLogs.ipAddress,
      userName: users.name
    })
    .from(activityLogs)
    .leftJoin(users, eq(activityLogs.userId, users.id))
    .where(eq(activityLogs.userId, user.id))
    .orderBy(desc(activityLogs.timestamp))
    .limit(10);
}

export async function getTeamForUser() {
  const user = await getUser();
  if (!user) {
    return null;
  }

  const result = await db.query.teamMembers.findFirst({
    where: eq(teamMembers.userId, user.id),
    with: {
      team: {
        with: {
          teamMembers: {
            with: {
              user: {
                columns: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          }
        }
      }
    }
  });

  return result?.team || null;
}

export async function getUserAppointmentProfile() {
  const user = await getUser();
  if (!user) {
    return null;
  }

  const result = await db
    .select()
    .from(appointmentProfiles)
    .where(eq(appointmentProfiles.userId, user.id))
    .limit(1);

  return result[0] || null;
}

export async function getQueuePosition(userId: number) {
  // Get the user's profile to check if they're waiting
  const userProfile = await db
    .select({ createdAt: appointmentProfiles.createdAt })
    .from(appointmentProfiles)
    .where(and(eq(appointmentProfiles.userId, userId), eq(appointmentProfiles.appointmentStatus, 'waiting')))
    .limit(1);

  if (!userProfile[0] || !userProfile[0].createdAt) {
    return null;
  }

  // Count how many people are ahead in the queue (created before this user and still waiting)
  const result = await db
    .select({ count: count() })
    .from(appointmentProfiles)
    .where(and(
      eq(appointmentProfiles.appointmentStatus, 'waiting'),
      lt(appointmentProfiles.createdAt, userProfile[0].createdAt)
    ));

  const queuePosition = Number(result[0]?.count || 0) + 1; // +1 because position starts from 1
  
  return queuePosition;
}

export async function checkExistingProfile(vorname: string, nachname: string) {
  const result = await db
    .select({ id: appointmentProfiles.id })
    .from(appointmentProfiles)
    .where(and(
      eq(appointmentProfiles.vorname, vorname),
      eq(appointmentProfiles.nachname, nachname)
    ))
    .limit(1);

  return result.length > 0;
}
