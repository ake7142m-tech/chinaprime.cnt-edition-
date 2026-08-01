/**
 * POST /api/payments/promptpay
 * Initiates a PromptPay payment for a booking deposit.
 *
 * 1. Creates an Omise PromptPay source (gets QR image URL from Omise)
 * 2. Creates an Omise charge pointing to that source
 * 3. Also generates a local EMV QR payload (as fallback / for display)
 * 4. Records the payment in our DB
 *
 * Body: { bookingId: string }
 *
 * Returns: {
 *   paymentId: string,
 *   qrData: string,          // raw EMV payload — pass to QR renderer
 *   omiseQrImageUrl?: string, // Omise-hosted QR image (optional)
 *   expiresAt: string,        // ISO timestamp (30 min window)
 *   chargeId: string
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getBookingById, createPayment } from '../../../lib/booking-store';
import { createPromptPaySource, createCharge } from '../../../lib/payment-gateway';
import { generatePromptPayQR, satangToTHB } from '../../../lib/promptpay';
import { siteConfig } from '../../../site-config';

// PromptPay phone / proxy for the business
const PROMPTPAY_PHONE = process.env.PROMPTPAY_PHONE ?? '0812345678';

export async function POST(req: NextRequest) {
  try {
    const { bookingId } = (await req.json()) as { bookingId: string };

    if (!bookingId) {
      return NextResponse.json({ error: 'bookingId is required' }, { status: 400 });
    }

    // ── Fetch booking ─────────────────────────────────────
    const booking = await getBookingById(bookingId);
    if (!booking) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลการจอง' }, { status: 404 });
    }
    if (booking.status === 'confirmed') {
      return NextResponse.json({ error: 'การจองนี้ชำระเงินแล้ว' }, { status: 409 });
    }

    const amountSatang = booking.depositAmount;
    const amountTHB = satangToTHB(amountSatang);

    // ── Generate local EMV QR (always available, no Omise required) ──
    const localQrData = generatePromptPayQR({
      phone: PROMPTPAY_PHONE,
      amountTHB,
    });

    // Expiry: 30 minutes from now
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    // ── Try Omise integration (optional — gracefully degrade) ─────────
    let chargeId = `LOCAL-${Date.now()}`;
    let sourceId: string | undefined;
    let omiseQrImageUrl: string | undefined;

    const omiseEnabled = Boolean(process.env.OMISE_SECRET_KEY);
    if (omiseEnabled) {
      try {
        // 1. Create PromptPay source
        const source = await createPromptPaySource(amountSatang);
        sourceId = source.id;
        omiseQrImageUrl = source.scannable_code?.image.download_uri;

        // 2. Create charge against the source
        const charge = await createCharge({
          amountSatang,
          description: `${siteConfig.brandName} — ${booking.tourTitle} (${booking.bookingRef})`,
          sourceId: source.id,
          returnUri: `${process.env.NEXT_PUBLIC_SITE_URL}/book/${booking.tourSlug}/confirm?bookingId=${bookingId}`,
          metadata: {
            booking_ref: booking.bookingRef,
            booking_id: bookingId,
            tour_slug: booking.tourSlug,
          },
        });
        chargeId = charge.id;
      } catch (omiseErr) {
        // Omise failed — fall back to local QR only (still usable via bank app)
        console.warn('[promptpay] Omise unavailable, using local QR:', omiseErr);
      }
    }

    // ── Persist payment record ────────────────────────────
    const payment = await createPayment({
      bookingId,
      amountSatang,
      method: 'promptpay',
      gateway: omiseEnabled ? 'omise' : 'manual',
      gatewayChargeId: chargeId,
      gatewaySourceId: sourceId,
      promptpayQrData: localQrData,
      promptpayExpiresAt: expiresAt,
    });

    return NextResponse.json({
      paymentId: payment.id,
      chargeId,
      qrData: localQrData,
      omiseQrImageUrl,
      amountTHB,
      expiresAt,
      bookingRef: booking.bookingRef,
    });

  } catch (err) {
    console.error('[POST /api/payments/promptpay]', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด กรุณาลองใหม่' }, { status: 500 });
  }
}
