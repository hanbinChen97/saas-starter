
// app/api/paypal/orders/create/route.ts
import { createPayPalOrder } from '@/app/lib/payments/paypal';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { amount = '10.00', currency = 'USD', referenceId, description } = await req.json();

    const order = await createPayPalOrder({
      amount,
      currency,
      referenceId,
      description,
    });

    return NextResponse.json({ orderID: order.id });
  } catch (error: any) {
    console.error('Failed to create PayPal order:', error);
    return NextResponse.json(
      { error: 'Failed to create order', details: error.message },
      { status: 500 }
    );
  }
}
