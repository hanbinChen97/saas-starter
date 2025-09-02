import { NextResponse } from 'next/server';
import { getUserAppointmentProfile, getQueuePosition, getUser } from '@/app/lib/db/queries';

interface QueueInfo {
  position: number;
  estimatedWaitTime: string;
}

// Calculate estimated wait time based on queue position
// All appointments will receive a response within 2 days
function calculateEstimatedWaitTime(position: number): string {
  return '2天内';
}

export async function GET() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await getUserAppointmentProfile();
    
    if (!profile) {
      return NextResponse.json({ profile: null, queueInfo: null });
    }

    // Calculate queue information based on appointment status
    let queueInfo: QueueInfo | null = null;
    if (profile.appointmentStatus === 'waiting') {
      const position = await getQueuePosition(user.id);
      if (position !== null) {
        queueInfo = {
          position,
          estimatedWaitTime: calculateEstimatedWaitTime(position),
        };
      }
    }

    return NextResponse.json({
      profile,
      queueInfo,
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}