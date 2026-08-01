/**
 * GET /api/bookings/[id]
 * Returns the current status of a booking.
 * Used by the PromptPay panel to poll for payment confirmation.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getBookingById } from '../../../lib/booking-store';

type Params = { params: Promise<{ id: string }> };

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const booking = await getBookingById(id);

    if (!booking) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลการจอง' }, { status: 404 });
    }

    // Return only safe, non-sensitive fields needed by the client
    return NextResponse.json({
      id: booking.id,
      bookingRef: booking.bookingRef,
      tourSlug: booking.tourSlug,
      status: booking.status,
      departureDate: booking.departureDate,
      passengerCount: booking.passengerCount,
    });
  } catch (err) {
    console.error('[GET /api/bookings/[id]]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
