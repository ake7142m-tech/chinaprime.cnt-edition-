/**
 * POST /api/bookings
 * Creates a booking and atomically holds seats.
 *
 * Body (JSON):
 *   tourSlug, tourTitle, departureDate (YYYY-MM-DD),
 *   leadName, leadPhone, leadEmail?,
 *   passengerCount, specialRequests?,
 *   pricePerPerson (THB), depositAmount (THB), totalAmount (THB)
 *
 * Returns: { booking }
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  createBooking,
  holdSeats,
  getSeatInventory,
} from '../../lib/booking-store';
import { thbToSatang } from '../../lib/promptpay';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      tourSlug: string;
      tourTitle: string;
      departureDate: string;
      leadName: string;
      leadPhone: string;
      leadEmail?: string;
      passengerCount: number;
      specialRequests?: string;
      pricePerPerson: number;
      depositAmount: number;
      totalAmount: number;
      customerUserId?: string;
    };

    // ── Validation ──────────────────────────────────────────
    const required = ['tourSlug', 'tourTitle', 'departureDate', 'leadName', 'leadPhone', 'passengerCount'] as const;
    for (const field of required) {
      if (!body[field]) {
        return NextResponse.json({ error: `กรุณากรอก ${field}` }, { status: 400 });
      }
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(body.departureDate)) {
      return NextResponse.json({ error: 'รูปแบบวันที่ไม่ถูกต้อง (YYYY-MM-DD)' }, { status: 400 });
    }

    const thaiPhoneRe = /^(0[6-9]\d{8}|0[2-5]\d{7,8})$/;
    const cleanPhone = body.leadPhone.replace(/\D/g, '');
    if (!thaiPhoneRe.test(cleanPhone)) {
      return NextResponse.json({ error: 'เบอร์โทรศัพท์ไม่ถูกต้อง' }, { status: 400 });
    }

    if (body.passengerCount < 1 || body.passengerCount > 20) {
      return NextResponse.json({ error: 'จำนวนผู้โดยสารต้องอยู่ระหว่าง 1-20 ท่าน' }, { status: 400 });
    }

    // ── Check seat availability ─────────────────────────────
    const inventory = await getSeatInventory(body.tourSlug, body.departureDate);
    if (inventory) {
      const available = inventory.availableSeats;
      if (available < body.passengerCount) {
        return NextResponse.json(
          {
            error: `ที่นั่งไม่เพียงพอ — เหลือเพียง ${available} ที่`,
            availableSeats: available,
          },
          { status: 409 },
        );
      }
    }

    // ── Atomically hold seats ───────────────────────────────
    if (inventory) {
      const held = await holdSeats(body.tourSlug, body.departureDate, body.passengerCount);
      if (!held) {
        return NextResponse.json(
          { error: 'ไม่สามารถจองที่นั่งได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง' },
          { status: 409 },
        );
      }
    }

    // ── Create booking record ───────────────────────────────
    const booking = await createBooking({
      tourSlug: body.tourSlug,
      tourTitle: body.tourTitle,
      departureDate: body.departureDate,
      leadName: body.leadName,
      leadPhone: cleanPhone,
      leadEmail: body.leadEmail,
      passengerCount: body.passengerCount,
      specialRequests: body.specialRequests,
      pricePerPersonSatang: thbToSatang(body.pricePerPerson),
      depositAmountSatang: thbToSatang(body.depositAmount),
      totalAmountSatang: thbToSatang(body.totalAmount),
      customerUserId: body.customerUserId,
    });

    return NextResponse.json({ booking }, { status: 201 });

  } catch (err) {
    console.error('[POST /api/bookings]', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด กรุณาลองใหม่' }, { status: 500 });
  }
}
