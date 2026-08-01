/**
 * POST /api/payments/webhook
 * Omise webhook endpoint — receives payment status updates.
 *
 * Verifies HMAC-SHA256 signature, then:
 *  - On charge.complete (succeeded): confirms seats, updates booking, sends confirmation SMS
 *  - On charge.failed / expired:    releases held seats, updates booking status
 *
 * Configure in Omise Dashboard → Webhooks → Add endpoint:
 *   https://your-domain.com/api/payments/webhook
 *   Events: charge.complete, charge.update
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getPaymentByChargeId,
  getBookingById,
  updatePaymentStatus,
  updateBookingStatus,
  confirmSeats,
  releaseHeldSeats,
  markBookingSmsSent,
  enqueueSms,
} from '../../../lib/booking-store';
import { verifyOmiseWebhook, mapOmiseStatus, type OmiseCharge } from '../../../lib/payment-gateway';
import { sendSms, buildConfirmationSms } from '../../../lib/sms-provider';
import { satangToTHB } from '../../../lib/promptpay';
import { siteConfig } from '../../../site-config';

export async function POST(req: NextRequest) {
  // ── 1. Read raw body for signature verification ───────
  const rawBody = await req.text();
  const signature = req.headers.get('x-omise-webhook-signature') ?? '';

  if (!verifyOmiseWebhook(rawBody, signature)) {
    console.warn('[webhook] Invalid signature — ignoring request');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  // ── 2. Parse event ────────────────────────────────────
  let event: { key: string; data: OmiseCharge };
  try {
    event = JSON.parse(rawBody) as typeof event;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { key, data: charge } = event;

  // Only handle charge events
  if (!key.startsWith('charge.')) {
    return NextResponse.json({ received: true });
  }

  console.log(`[webhook] ${key} → charge ${charge.id} status=${charge.status}`);

  // ── 3. Look up payment + booking ──────────────────────
  const payment = await getPaymentByChargeId(charge.id);
  if (!payment) {
    // Not our charge (e.g. test webhook) — acknowledge without error
    console.log(`[webhook] No payment found for charge ${charge.id}`);
    return NextResponse.json({ received: true });
  }

  const booking = await getBookingById(payment.bookingId);
  if (!booking) {
    console.error(`[webhook] No booking found for payment ${payment.id}`);
    return NextResponse.json({ received: true });
  }

  const omiseStatus = mapOmiseStatus(charge);

  // ── 4. Handle SUCCESS ─────────────────────────────────
  if (omiseStatus === 'succeeded' && booking.status !== 'confirmed') {
    // Update payment
    await updatePaymentStatus(payment.id, 'succeeded', {
      gatewayRawResponse: charge as unknown as object,
      gatewayCardLast4: charge.card?.last_digits,
      gatewayCardBrand: charge.card?.brand,
      paidAt: new Date().toISOString(),
    });

    // Confirm booking
    await updateBookingStatus(booking.id, 'confirmed');

    // Confirm seats (move held → sold)
    await confirmSeats(booking.tourSlug, booking.departureDate, booking.passengerCount);

    // Send confirmation SMS (if not already sent)
    if (!booking.smsConfirmSent) {
      const departureDateDisplay = formatThaiDate(booking.departureDate);
      const smsBody = buildConfirmationSms({
        bookingRef: booking.bookingRef,
        tourTitle: booking.tourTitle,
        departureDate: departureDateDisplay,
        passengerCount: booking.passengerCount,
        depositTHB: satangToTHB(booking.depositAmount),
        totalTHB: satangToTHB(booking.totalAmount),
        lineUrl: siteConfig.lineUrl,
      });

      const smsResult = await sendSms(booking.leadPhone, smsBody);
      const smsId = await enqueueSms(
        booking.id,
        'booking_confirm',
        booking.leadPhone,
        smsBody,
      );

      if (smsResult.success) {
        await markBookingSmsSent(booking.id, 'confirm');
        // Mark SMS as sent immediately
        const { markSmsStatus } = await import('../../../lib/booking-store');
        await markSmsStatus(smsId, 'sent', { providerMessageId: smsResult.messageId });
      } else {
        const { markSmsStatus } = await import('../../../lib/booking-store');
        await markSmsStatus(smsId, 'failed', { providerError: smsResult.error });
        console.error(`[webhook] SMS failed for booking ${booking.bookingRef}:`, smsResult.error);
      }
    }

    console.log(`[webhook] ✅ Booking ${booking.bookingRef} confirmed`);
  }

  // ── 5. Handle FAILURE / EXPIRY ────────────────────────
  if (omiseStatus === 'failed' && payment.status !== 'failed') {
    await updatePaymentStatus(payment.id, 'failed', {
      failedAt: new Date().toISOString(),
      gatewayRawResponse: charge as unknown as object,
    });

    // Release held seats
    if (booking.status === 'pending') {
      await releaseHeldSeats(booking.tourSlug, booking.departureDate, booking.passengerCount);
    }

    console.log(`[webhook] ❌ Payment failed for booking ${booking.bookingRef}`);
  }

  // Always acknowledge to Omise
  return NextResponse.json({ received: true });
}

// ── Helpers ────────────────────────────────────────────────────────
/** "2026-08-15" → "15 ส.ค. 69" */
function formatThaiDate(isoDate: string): string {
  const thaiMonths = [
    'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
    'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
  ];
  const [year, month, day] = isoDate.split('-').map(Number);
  const buddhistYear = (year - 2500).toString().slice(-2);
  return `${day} ${thaiMonths[month - 1]} ${buddhistYear}`;
}
