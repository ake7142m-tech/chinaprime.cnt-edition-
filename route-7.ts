/**
 * POST /api/sms          — send SMS immediately (admin / webhook use)
 * GET  /api/sms/process  — process queued SMS (cron job endpoint)
 *
 * This file handles both routes via a single module.
 *
 * Cron schedule (vercel.json):
 * {
 *   "crons": [
 *     { "path": "/api/sms?action=process", "schedule": "0 8 * * *" },
 *     { "path": "/api/sms?action=reminders", "schedule": "0 9 * * *" }
 *   ]
 * }
 *
 * The "process" action drains the sms_notifications queue.
 * The "reminders" action finds bookings 3 days out and sends reminder SMSes.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  enqueueSms,
  markSmsStatus,
  getDueSmsNotifications,
  getBookingsDueForReminder,
  markBookingSmsSent,
  getBookingById,
} from '../../lib/booking-store';
import { sendSms, buildReminderSms } from '../../lib/sms-provider';
import { satangToTHB } from '../../lib/promptpay';
import { siteConfig } from '../../site-config';

function requireCronAuth(req: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return true; // dev mode — skip auth
  const auth = req.headers.get('authorization');
  return auth === `Bearer ${cronSecret}`;
}

// ── POST: send SMS immediately ────────────────────────────────────
export async function POST(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && req.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await req.json()) as {
    bookingId: string;
    type: 'booking_confirm' | 'reminder_3day' | 'custom';
    customBody?: string;
  };

  const booking = await getBookingById(body.bookingId);
  if (!booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  }

  let messageBody: string;
  if (body.type === 'custom' && body.customBody) {
    messageBody = body.customBody;
  } else if (body.type === 'booking_confirm') {
    messageBody = buildBookingConfirmSms(booking);
  } else {
    messageBody = buildReminderSmsFromBooking(booking);
  }

  const smsResult = await sendSms(booking.leadPhone, messageBody);
  const smsId = await enqueueSms(booking.id, body.type, booking.leadPhone, messageBody);

  if (smsResult.success) {
    await markSmsStatus(smsId, 'sent', { providerMessageId: smsResult.messageId });
    if (body.type === 'booking_confirm') await markBookingSmsSent(booking.id, 'confirm');
    if (body.type === 'reminder_3day') await markBookingSmsSent(booking.id, 'reminder');
  } else {
    await markSmsStatus(smsId, 'failed', { providerError: smsResult.error });
  }

  return NextResponse.json({ success: smsResult.success, messageId: smsResult.messageId });
}

// ── GET: cron actions ─────────────────────────────────────────────
export async function GET(req: NextRequest) {
  if (!requireCronAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const action = req.nextUrl.searchParams.get('action');

  // ── Process queued SMS ───────────────────────────────
  if (action === 'process') {
    const due = await getDueSmsNotifications(100);
    let sent = 0;
    let failed = 0;

    for (const sms of due) {
      const result = await sendSms(sms.recipientPhone, sms.messageBody);
      if (result.success) {
        await markSmsStatus(sms.id, 'sent', { providerMessageId: result.messageId });
        if (sms.type === 'booking_confirm') await markBookingSmsSent(sms.bookingId, 'confirm');
        if (sms.type === 'reminder_3day') await markBookingSmsSent(sms.bookingId, 'reminder');
        sent++;
      } else {
        await markSmsStatus(sms.id, 'failed', { providerError: result.error });
        failed++;
      }
    }

    return NextResponse.json({ processed: due.length, sent, failed, timestamp: new Date().toISOString() });
  }

  // ── Queue 3-day reminders ────────────────────────────
  if (action === 'reminders') {
    const bookings = await getBookingsDueForReminder();
    let queued = 0;

    for (const booking of bookings) {
      const messageBody = buildReminderSmsFromBooking(booking);
      // Schedule for 9:00 AM Thai time (UTC+7)
      const scheduledAt = new Date();
      scheduledAt.setUTCHours(2, 0, 0, 0); // 09:00 ICT
      if (scheduledAt < new Date()) scheduledAt.setDate(scheduledAt.getDate() + 1);

      await enqueueSms(
        booking.id,
        'reminder_3day',
        booking.leadPhone,
        messageBody,
        scheduledAt,
      );
      queued++;
    }

    return NextResponse.json({ queued, bookingsChecked: bookings.length, timestamp: new Date().toISOString() });
  }

  return NextResponse.json({ error: 'Unknown action. Use ?action=process or ?action=reminders' }, { status: 400 });
}

// ── SMS body builders ─────────────────────────────────────────────
import type { Booking } from '../../lib/booking-store';

function buildBookingConfirmSms(booking: Booking): string {
  const { buildConfirmationSms } = require('../../lib/sms-provider');
  return buildConfirmationSms({
    bookingRef: booking.bookingRef,
    tourTitle: booking.tourTitle,
    departureDate: formatThaiDate(booking.departureDate),
    passengerCount: booking.passengerCount,
    depositTHB: satangToTHB(booking.depositAmount),
    totalTHB: satangToTHB(booking.totalAmount),
    lineUrl: siteConfig.lineUrl,
  });
}

function buildReminderSmsFromBooking(booking: Booking): string {
  return buildReminderSms({
    bookingRef: booking.bookingRef,
    tourTitle: booking.tourTitle,
    departureDate: formatThaiDate(booking.departureDate),
    passengerCount: booking.passengerCount,
    depositTHB: satangToTHB(booking.depositAmount),
    totalTHB: satangToTHB(booking.totalAmount),
    lineUrl: siteConfig.lineUrl,
  });
}

function formatThaiDate(isoDate: string): string {
  const thaiMonths = [
    'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
    'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
  ];
  const [year, month, day] = isoDate.split('-').map(Number);
  const buddhistYear = (year - 2500).toString().slice(-2);
  return `${day} ${thaiMonths[month - 1]} ${buddhistYear}`;
}
