import { NextResponse } from 'next/server';
import { getUserAppointmentProfile, getQueuePosition, getUser } from '@/app/lib/db/queries';

interface QueueInfo {
  position: number;
  estimatedWaitTime: string;
}

// Calculate estimated wait time based on queue position
// Each person takes approximately 3 days
function calculateEstimatedWaitTime(position: number): string {
  const daysPerPerson = 3;
  const totalDays = (position - 1) * daysPerPerson; // -1 because current user is not ahead of themselves
  
  if (totalDays === 0) {
    return '即将轮到您';
  } else if (totalDays < 7) {
    return `${totalDays}天`;
  } else {
    const weeks = Math.floor(totalDays / 7);
    const remainingDays = totalDays % 7;
    if (remainingDays === 0) {
      return `${weeks}周`;
    } else {
      return `${weeks}周${remainingDays}天`;
    }
  }
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