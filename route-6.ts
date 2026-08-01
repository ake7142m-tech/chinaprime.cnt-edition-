/**
 * POST /api/seats/sync
 * Sync seat inventory from an external airline or land-operator API.
 *
 * Call this:
 *  - From a Vercel Cron (every 15 min: "* /15 * * * *")
 *  - From the admin panel "Sync Seats" button
 *  - After a manual airline seat-release
 *
 * Requires: Authorization: Bearer <SEATS_SYNC_SECRET>
 *
 * Body (optional): { tourSlug?: string }
 * — omit to sync all tours; provide tourSlug to sync only one.
 *
 * The external connector is configured via:
 *   SEAT_PROVIDER=nok_air | thai_lion | tour_operator | none
 *   SEAT_PROVIDER_API_KEY=...
 *   SEAT_PROVIDER_API_URL=... (if applicable)
 *
 * Providers:
 *  - "nok_air"       — Nok Air availability API (example connector)
 *  - "thai_lion"     — Thai Lion Air (example connector)
 *  - "tour_operator" — Generic tour operator REST/webhook API
 *  - "none"          — No external sync; manual management only
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '../../../lib/supabase-server';
import { upsertSeatInventory } from '../../../lib/booking-store';

export async function POST(req: NextRequest) {
  // ── Auth check ───────────────────────────────────────
  const authHeader = req.headers.get('authorization');
  const syncSecret = process.env.SEATS_SYNC_SECRET;
  if (syncSecret && authHeader !== `Bearer ${syncSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as { tourSlug?: string };
  const provider = (process.env.SEAT_PROVIDER ?? 'none') as SeatProvider;

  if (provider === 'none') {
    return NextResponse.json({ message: 'Seat sync disabled (SEAT_PROVIDER=none)' });
  }

  try {
    const sb = getSupabaseAdminClient();

    // ── Fetch tours to sync ───────────────────────────
    let query = sb.from('join_tours').select('slug, title, departure_schedules');
    if (body.tourSlug) {
      query = query.eq('slug', body.tourSlug) as typeof query;
    }
    const { data: tours, error } = await query;
    if (error) throw new Error(error.message);

    const synced: SyncResult[] = [];
    const failed: { slug: string; error: string }[] = [];

    for (const tour of tours as TourRow[]) {
      const schedules = (tour.departure_schedules ?? []) as DepartureScheduleRow[];

      for (const schedule of schedules) {
        // Only sync future departures
        const departureDate = parseScheduleDate(schedule.date);
        if (!departureDate || departureDate < new Date()) continue;
        const dateStr = departureDate.toISOString().split('T')[0];

        try {
          const externalData = await fetchExternalSeats(provider, tour.slug, dateStr, schedule);

          await upsertSeatInventory(tour.slug, dateStr, externalData.totalSeats, {
            syncSource: provider,
            externalRef: externalData.externalRef,
          });

          // Update sold/held from external data if provider supports it
          if (externalData.soldSeats !== undefined) {
            const sb2 = getSupabaseAdminClient();
            await sb2
              .from('seat_inventory')
              .update({
                sold_seats: externalData.soldSeats,
                last_synced_at: new Date().toISOString(),
              })
              .eq('tour_slug', tour.slug)
              .eq('departure_date', dateStr);
          }

          synced.push({ slug: tour.slug, date: dateStr, totalSeats: externalData.totalSeats });
        } catch (err) {
          failed.push({
            slug: tour.slug,
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      provider,
      synced: synced.length,
      failed: failed.length,
      results: synced,
      errors: failed,
      syncedAt: new Date().toISOString(),
    });

  } catch (err) {
    console.error('[POST /api/seats/sync]', err);
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}

// ── Types ──────────────────────────────────────────────────────────
type SeatProvider = 'nok_air' | 'thai_lion' | 'tour_operator' | 'none';

interface TourRow {
  slug: string;
  title: string;
  departure_schedules?: DepartureScheduleRow[];
}

interface DepartureScheduleRow {
  date: string;         // e.g. "15-19 ส.ค. 69"  or "2026-08-15"
  availability: string; // e.g. "ว่าง" | "ใกล้เต็ม" | "เต็ม"
  price: string;
}

interface ExternalSeatData {
  totalSeats: number;
  soldSeats?: number;
  externalRef?: string;
}

interface SyncResult {
  slug: string;
  date: string;
  totalSeats: number;
}

// ── External seat fetchers (adapt these to actual provider APIs) ───

async function fetchExternalSeats(
  provider: SeatProvider,
  tourSlug: string,
  departureDate: string,
  schedule: DepartureScheduleRow,
): Promise<ExternalSeatData> {
  switch (provider) {
    case 'nok_air':
      return fetchNokAirSeats(tourSlug, departureDate);
    case 'thai_lion':
      return fetchThaiLionSeats(tourSlug, departureDate);
    case 'tour_operator':
      return fetchOperatorSeats(tourSlug, departureDate, schedule);
    default:
      return { totalSeats: 20 }; // safe default
  }
}

/**
 * Example: Nok Air XML/REST API connector.
 * Replace with real endpoint and auth from your Nok Air agent contract.
 */
async function fetchNokAirSeats(
  tourSlug: string,
  departureDate: string,
): Promise<ExternalSeatData> {
  const apiUrl = process.env.SEAT_PROVIDER_API_URL;
  const apiKey = process.env.SEAT_PROVIDER_API_KEY;

  if (!apiUrl || !apiKey) {
    console.warn('[seat-sync] SEAT_PROVIDER_API_URL or KEY not set — using fallback');
    return { totalSeats: 20 };
  }

  const res = await fetch(`${apiUrl}/availability?flight=${tourSlug}&date=${departureDate}`, {
    headers: { 'X-API-Key': apiKey, Accept: 'application/json' },
    next: { revalidate: 0 },
  });

  if (!res.ok) throw new Error(`Nok Air API error: ${res.status}`);
  const data = (await res.json()) as {
    available_seats: number;
    booked_seats: number;
    flight_ref: string;
  };

  return {
    totalSeats: data.available_seats + data.booked_seats,
    soldSeats: data.booked_seats,
    externalRef: data.flight_ref,
  };
}

/**
 * Example: Thai Lion Air connector.
 * Real integration uses their agent portal API or NDC feed.
 */
async function fetchThaiLionSeats(
  tourSlug: string,
  departureDate: string,
): Promise<ExternalSeatData> {
  const apiUrl = process.env.SEAT_PROVIDER_API_URL;
  const apiKey = process.env.SEAT_PROVIDER_API_KEY;

  if (!apiUrl || !apiKey) return { totalSeats: 20 };

  const res = await fetch(
    `${apiUrl}/seat-map?route=${tourSlug}&departure=${departureDate}`,
    { headers: { Authorization: `Bearer ${apiKey}` } },
  );

  if (!res.ok) throw new Error(`Thai Lion API error: ${res.status}`);
  const data = (await res.json()) as { seatsAvailable: number; totalCapacity: number };

  return {
    totalSeats: data.totalCapacity,
    soldSeats: data.totalCapacity - data.seatsAvailable,
  };
}

/**
 * Generic tour operator / land-operator connector.
 * Expects a simple REST endpoint returning seat counts.
 */
async function fetchOperatorSeats(
  tourSlug: string,
  departureDate: string,
  schedule: DepartureScheduleRow,
): Promise<ExternalSeatData> {
  const apiUrl = process.env.SEAT_PROVIDER_API_URL;
  const apiKey = process.env.SEAT_PROVIDER_API_KEY;

  if (!apiUrl || !apiKey) {
    // Fallback: infer from availability string in tour data
    return inferFromAvailabilityString(schedule.availability);
  }

  const res = await fetch(`${apiUrl}/tours/${tourSlug}/departures/${departureDate}/seats`, {
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
  });

  if (!res.ok) throw new Error(`Operator API error: ${res.status}`);
  const data = (await res.json()) as { total: number; sold: number; ref?: string };

  return {
    totalSeats: data.total,
    soldSeats: data.sold,
    externalRef: data.ref,
  };
}

/** Infer rough seat counts from Thai availability text */
function inferFromAvailabilityString(availability: string): ExternalSeatData {
  if (availability.includes('เต็ม') && !availability.includes('ใกล้')) {
    return { totalSeats: 20, soldSeats: 20 };
  }
  if (availability.includes('ใกล้เต็ม') || availability.includes('เหลือน้อย')) {
    return { totalSeats: 20, soldSeats: 16 };  // ~4 remaining
  }
  return { totalSeats: 20, soldSeats: 0 };
}

/** Parse a departure date string to a JS Date */
function parseScheduleDate(dateStr: string): Date | null {
  // ISO format "2026-08-15"
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return new Date(dateStr);
  }

  // Thai display format "15-19 ส.ค. 69" — take first number as day
  const thaiMonths: Record<string, number> = {
    'ม.ค.': 1, 'ก.พ.': 2, 'มี.ค.': 3, 'เม.ย.': 4,
    'พ.ค.': 5, 'มิ.ย.': 6, 'ก.ค.': 7, 'ส.ค.': 8,
    'ก.ย.': 9, 'ต.ค.': 10, 'พ.ย.': 11, 'ธ.ค.': 12,
  };
  const match = dateStr.match(/(\d+)[\s-]*[\d]*\s+([ก-ๆ.]+)\s+(\d{2})/);
  if (!match) return null;
  const day = parseInt(match[1]);
  const month = thaiMonths[match[2]];
  const buddhistYear = parseInt(match[3]) + 2500;
  const gregorianYear = buddhistYear - 543;
  if (!month) return null;
  return new Date(gregorianYear, month - 1, day);
}
