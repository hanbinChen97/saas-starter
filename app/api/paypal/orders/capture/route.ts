
import { capturePayPalOrder } from '@/app/lib/payments/paypal';
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/app/lib/auth/session';
import { db } from '@/app/lib/db/drizzle';
import { appointmentProfiles } from '@/app/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderID } = await req.json();

    if (!orderID) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const captureData = await capturePayPalOrder(orderID);

    if (captureData.status === 'COMPLETED') {
      console.log('Payment completed successfully!', captureData);

      // Update appointment status to 'waiting'
      await db
        .update(appointmentProfiles)
        .set({
          appointmentStatus: 'waiting',
          appointmentDate: null, // Reset appointment date
          updatedAt: new Date(),
        })
        .where(eq(appointmentProfiles.userId, session.user.id));
    }

    return NextResponse.json(captureData);
  } catch (error: any) {
    console.error('Failed to capture PayPal order:', error);
    return NextResponse.json(
      { error: 'Failed to capture order', details: error.message },
      { status: 500 }
    );
  }
}
