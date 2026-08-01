'use client';

import SEOHead from '@/components/SEOHead';
import Breadcrumb from '@/components/Breadcrumb';
import { formatPrice } from '@/lib/utils';
import type { Tour } from '@/lib/constants';

// Sample tour data
const tour: Tour = {
  id: '1', title: 'ทัวร์เชียงใหม่ 3 วัน', slug: 'chiangmai-3d',
  description: 'ทัวร์เชียงใหม่ 3 วัน',
  itinerary: [], price: 3500, duration: '3 วัน', category: 'ภาคเหนือ', region: 'เชียงใหม่',
  image: '', seatsAvailable: 15,
  schedules: [
    { date: '2024-04-10', seatsAvailable: 15, price: 3500 },
    { date: '2024-04-20', seatsAvailable: 10, price: 3500 },
    { date: '2024-05-01', seatsAvailable: 20, price: 3200 },
  ],
};

export default function BookingPage({ params }: { params: { slug: string } }) {
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Submit booking to cloud-functions/api/bookings
  }

  return (
    <>
      <SEOHead title={`จอง ${tour.title}`} description={`จองทัวร์${tour.title}`} canonicalPath={`/tours/${params.slug}/book`} />

      <div className="page-container">
        <Breadcrumb items={[
          { label: 'หน้าแรก', href: '/' },
          { label: 'ทัวร์', href: '/tours' },
          { label: tour.title, href: `/tours/${tour.slug}` },
          { label: 'จองทัวร์' },
        ]} />

        <h1 className="section-title">จอง{tour.title}</h1>

        <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
          {/* Schedule Selection */}
          <div>
            <label className="label-flat">วันเดินทาง</label>
            <select className="input-flat w-full">
              {tour.schedules.map((s, i) => (
                <option key={i} value={s.date}>
                  {s.date} - {formatPrice(s.price)} ({s.seatsAvailable > 0 ? `เหลือ ${s.seatsAvailable} ที่นั่ง` : 'เต็ม'})
                </option>
              ))}
            </select>
          </div>

          {/* Traveler Count */}
          <div>
            <label className="label-flat">จำนวนผู้เดินทาง</label>
            <input type="number" min={1} defaultValue={1} className="input-flat w-full" />
          </div>

          {/* Name */}
          <div>
            <label className="label-flat">ชื่อ-นามสกุล</label>
            <input type="text" className="input-flat w-full" required />
          </div>

          {/* Phone */}
          <div>
            <label className="label-flat">เบอร์โทรศัพท์</label>
            <input type="tel" className="input-flat w-full" required />
          </div>

          {/* Email */}
          <div>
            <label className="label-flat">อีเมล</label>
            <input type="email" className="input-flat w-full" required />
          </div>

          {/* Payment Proof Upload */}
          <div>
            <label className="label-flat">หลักฐานการชำระเงิน (สลิป/หลักฐานโอน)</label>
            <input type="file" accept="image/*,.pdf" className="input-flat w-full" />
            <p className="font-thai text-xs text-neutral-400 mt-1">รูปภาพหรือ PDF ขนาดไม่เกิน 5MB</p>
          </div>

          {/* Total Price Estimate */}
          <div className="card-flat">
            <p className="font-thai text-sm text-neutral-600">ราคาประมาณ: <span className="font-bold text-primary">{formatPrice(tour.price)}/คน</span></p>
          </div>

          <button type="submit" className="btn-primary w-full">ยืนยันการจอง</button>
        </form>
      </div>
    </>
  );
}
