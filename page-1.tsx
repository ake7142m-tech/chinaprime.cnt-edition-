import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getJoinTourBySlug } from '../../lib/content-store';
import { getAllSeatInventoryForTour } from '../../lib/booking-store';
import { calculateDeposit } from '../../lib/payment-gateway';
import { BookingClient } from './booking-client';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tour = await getJoinTourBySlug(slug);
  if (!tour) return { title: 'จองทัวร์ | CHINA PRIME' };
  return {
    title: `จอง ${tour.title} | CHINA PRIME`,
    description: `จองจอยทัวร์ ${tour.title} — ชำระมัดจำผ่าน PromptPay หรือบัตรเครดิต`,
    robots: { index: false },
  };
}

export const dynamic = 'force-dynamic';

export default async function BookPage({ params }: Props) {
  const { slug } = await params;
  const tour = await getJoinTourBySlug(slug);
  if (!tour) notFound();

  const seatInventories = await getAllSeatInventoryForTour(slug);

  // Map departure_schedules to dates with live seat data
  const departureDates = (tour.departureSchedules ?? []).map((schedule) => {
    const dateStr = parseDateToISO(schedule.date);
    const inventory = seatInventories.find((s) => s.departureDate === dateStr);
    return {
      label: schedule.date,
      isoDate: dateStr,
      price: schedule.price,
      availability: schedule.availability,
      availableSeats: inventory?.availableSeats ?? 20,
      totalSeats: inventory?.totalSeats ?? 20,
    };
  });

  const depositTHB = calculateDeposit(tour.priceValue);

  return (
    <BookingClient
      tour={{
        slug: tour.slug,
        title: tour.title,
        duration: tour.duration,
        image: tour.image,
        priceValue: tour.priceValue,
        price: tour.price,
      }}
      departureDates={departureDates}
      depositTHB={depositTHB}
    />
  );
}

/** Attempt to parse a Thai display date string to "YYYY-MM-DD" */
function parseDateToISO(dateStr: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;

  const thaiMonths: Record<string, number> = {
    'ม.ค.': 1, 'ก.พ.': 2, 'มี.ค.': 3, 'เม.ย.': 4,
    'พ.ค.': 5, 'มิ.ย.': 6, 'ก.ค.': 7, 'ส.ค.': 8,
    'ก.ย.': 9, 'ต.ค.': 10, 'พ.ย.': 11, 'ธ.ค.': 12,
  };

  const match = dateStr.match(/(\d+)[^\d]+\s*([ก-ๆ.]+)\s+(\d{2})/);
  if (!match) return new Date().toISOString().split('T')[0];

  const day = parseInt(match[1]).toString().padStart(2, '0');
  const month = (thaiMonths[match[2]] ?? 1).toString().padStart(2, '0');
  const gregorianYear = parseInt(match[3]) + 2500 - 543;
  return `${gregorianYear}-${month}-${day}`;
}
