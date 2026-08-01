/**
 * GET  /api/seats?tourSlug=xxx&date=YYYY-MM-DD  — single date availability
 * GET  /api/seats?tourSlug=xxx                  — all upcoming dates for tour
 * POST /api/seats/sync  (see sync/route.ts)     — force sync from external API
 *
 * This route is called by the client widget for real-time seat display.
 * Supabase Realtime can also be used directly from the client for push updates.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getSeatInventory,
  getAllSeatInventoryForTour,
  upsertSeatInventory,
} from '../../lib/booking-store';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const tourSlug = searchParams.get('tourSlug');
    const date = searchParams.get('date');

    if (!tourSlug) {
      return NextResponse.json({ error: 'tourSlug is required' }, { status: 400 });
    }

    // ── Single date ──────────────────────────────────────
    if (date) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
      }

      let inventory = await getSeatInventory(tourSlug, date);

      // Auto-create entry with sensible defaults if not yet seeded
      if (!inventory) {
        inventory = await upsertSeatInventory(tourSlug, date, 20);
      }

      return NextResponse.json(
        {
          tourSlug,
          date,
          totalSeats: inventory.totalSeats,
          availableSeats: inventory.availableSeats,
          heldSeats: inventory.heldSeats,
          soldSeats: inventory.soldSeats,
          lastSyncedAt: inventory.lastSyncedAt,
          availability: classifyAvailability(inventory.availableSeats),
        },
        {
          headers: {
            'Cache-Control': 'no-store',
            'X-Last-Synced': inventory.lastSyncedAt ?? 'never',
          },
        },
      );
    }

    // ── All upcoming dates ───────────────────────────────
    const inventories = await getAllSeatInventoryForTour(tourSlug);
    return NextResponse.json({
      tourSlug,
      dates: inventories.map((inv) => ({
        date: inv.departureDate,
        totalSeats: inv.totalSeats,
        availableSeats: inv.availableSeats,
        heldSeats: inv.heldSeats,
        soldSeats: inv.soldSeats,
        availability: classifyAvailability(inv.availableSeats),
      })),
    });

  } catch (err) {
    console.error('[GET /api/seats]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// ── Availability classification ────────────────────────────────────
export type AvailabilityLevel = 'open' | 'limited' | 'critical' | 'sold_out';

export function classifyAvailability(availableSeats: number): AvailabilityLevel {
  if (availableSeats === 0) return 'sold_out';
  if (availableSeats <= 3) return 'critical';
  if (availableSeats <= 7) return 'limited';
  return 'open';
}
