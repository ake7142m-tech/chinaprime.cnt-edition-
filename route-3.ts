/**
 * POST /api/payments/card
 * Process a credit/debit card payment using an Omise card token.
 *
 * The card token is created client-side via Omise.js (never raw card data in server).
 *
 * Body: { bookingId: string; omiseToken: string }
 *
 * Returns:
 *   200 → { paymentId, chargeId, status: 'succeeded' | 'pending_3ds', authorizeUri? }
 *   402 → { error, failureCode }  — card declined / 3DS required
 */

import { NextRequest, NextResponse } from 'next/server';
import { getBookingById, createPayment, updatePaymentStatus } from '../../../lib/booking-store';
import { createCharge, mapOmiseStatus } from '../../../lib/payment-gateway';
import { siteConfig } from '../../../site-config';

export async function POST(req: NextRequest) {
  try {
    const { bookingId, omiseToken } = (await req.json()) as {
      bookingId: string;
      omiseToken: string;
    };

    if (!bookingId || !omiseToken) {
      return NextResponse.json(
        { error: 'bookingId และ omiseToken จำเป็นต้องระบุ' },
        { status: 400 },
      );
    }

    if (!process.env.OMISE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Payment gateway not configured' },
        { status: 503 },
      );
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

    // ── Create Omise charge ───────────────────────────────
    const charge = await createCharge({
      amountSatang,
      description: `${siteConfig.brandName} — ${booking.tourTitle} (${booking.bookingRef})`,
      cardToken: omiseToken,
      returnUri: `${process.env.NEXT_PUBLIC_SITE_URL}/book/${booking.tourSlug}/confirm?bookingId=${bookingId}`,
      metadata: {
        booking_ref: booking.bookingRef,
        booking_id: bookingId,
        tour_slug: booking.tourSlug,
      },
    });

    // ── Persist payment ───────────────────────────────────
    const payment = await createPayment({
      bookingId,
      amountSatang,
      method: 'credit_card',
      gateway: 'omise',
      gatewayChargeId: charge.id,
      ...(charge.card
        ? {
            gatewayCardLast4: charge.card.last_digits,
            gatewayCardBrand: charge.card.brand,
          }
        : {}),
    });

    const status = mapOmiseStatus(charge);

    // ── Handle 3DS redirect ───────────────────────────────
    if (charge.authorize_uri && charge.status === 'pending') {
      return NextResponse.json({
        paymentId: payment.id,
        chargeId: charge.id,
        status: 'pending_3ds',
        authorizeUri: charge.authorize_uri,
      });
    }

    // ── Immediate success ─────────────────────────────────
    if (status === 'succeeded') {
      await updatePaymentStatus(payment.id, 'succeeded', {
        gatewayRawResponse: charge as unknown as object,
        paidAt: new Date().toISOString(),
      });
      return NextResponse.json({
        paymentId: payment.id,
        chargeId: charge.id,
        status: 'succeeded',
        last4: charge.card?.last_digits,
        brand: charge.card?.brand,
      });
    }

    // ── Declined ──────────────────────────────────────────
    await updatePaymentStatus(payment.id, 'failed', {
      failedAt: new Date().toISOString(),
      gatewayRawResponse: charge as unknown as object,
    });

    return NextResponse.json(
      {
        error: 'บัตรถูกปฏิเสธ กรุณาตรวจสอบข้อมูลบัตรหรือติดต่อธนาคาร',
        failureCode: charge.failure_code,
      },
      { status: 402 },
    );

  } catch (err) {
    console.error('[POST /api/payments/card]', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด กรุณาลองใหม่' }, { status: 500 });
  }
}
