'use client';

import { useState, useMemo } from 'react';
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
  const [scheduleDate, setScheduleDate] = useState(tour.schedules[0]?.date || '');
  const [travelerCount, setTravelerCount] = useState(1);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [paymentFile, setPaymentFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const selectedSchedule = useMemo(
    () => tour.schedules.find((s) => s.date === scheduleDate),
    [scheduleDate]
  );

  const totalPrice = useMemo(
    () => (selectedSchedule?.price || tour.price) * travelerCount,
    [selectedSchedule, travelerCount, tour.price]
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let paymentProof = '';

      // Upload payment proof if provided
      if (paymentFile) {
        const formData = new FormData();
        formData.append('file', paymentFile);
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
        if (!uploadRes.ok) {
          setError('อัปโหลดหลักฐานการชำระเงินไม่สำเร็จ');
          return;
        }
        const uploadData = await uploadRes.json();
        paymentProof = uploadData.url || uploadData.fileUrl || '';
      }

      // Create booking
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tourId: tour.id,
          userId: '',
          scheduleDate,
          travelerCount,
          totalPrice,
          paymentProof,
          name,
          phone,
          email,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'จองทัวร์ไม่สำเร็จ');
        return;
      }

      setSuccess(true);
    } catch {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <>
        <SEOHead title={`จอง ${tour.title} สำเร็จ`} description={`จองทัวร์${tour.title}สำเร็จ`} canonicalPath={`/tours/${params.slug}/book`} />
        <div className="page-container max-w-xl">
          <div className="card-flat text-center py-8">
            <p className="font-thai text-lg font-bold text-green-600 mb-2">จองทัวร์สำเร็จ!</p>
            <p className="font-thai text-sm text-neutral-500">ระบบจะส่งอีเมลยืนยันการจองให้คุณ</p>
            <a href="/tours" className="btn-primary inline-block mt-4">กลับหน้าทัวร์</a>
          </div>
        </div>
      </>
    );
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

        {error && (
          <div className="card-flat mb-4 text-red-600 font-thai text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
          {/* Schedule Selection */}
          <div>
            <label className="label-flat">วันเดินทาง</label>
            <select
              className="input-flat w-full"
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
            >
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
            <input
              type="number"
              min={1}
              value={travelerCount}
              onChange={(e) => setTravelerCount(Number(e.target.value))}
              className="input-flat w-full"
            />
          </div>

          {/* Name */}
          <div>
            <label className="label-flat">ชื่อ-นามสกุล</label>
            <input
              type="text"
              className="input-flat w-full"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Phone */}
          <div>
            <label className="label-flat">เบอร์โทรศัพท์</label>
            <input
              type="tel"
              className="input-flat w-full"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          {/* Email */}
          <div>
            <label className="label-flat">อีเมล</label>
            <input
              type="email"
              className="input-flat w-full"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Payment Proof Upload */}
          <div>
            <label className="label-flat">หลักฐานการชำระเงิน (สลิป/หลักฐานโอน)</label>
            <input
              type="file"
              accept="image/*,.pdf"
              className="input-flat w-full"
              onChange={(e) => setPaymentFile(e.target.files?.[0] || null)}
            />
            <p className="font-thai text-xs text-neutral-400 mt-1">รูปภาพหรือ PDF ขนาดไม่เกิน 5MB</p>
          </div>

          {/* Total Price */}
          <div className="card-flat">
            <p className="font-thai text-sm text-neutral-600">
              ราคาต่อคน: <span className="font-bold text-primary">{formatPrice(selectedSchedule?.price || tour.price)}</span>
            </p>
            <p className="font-thai text-sm text-neutral-600 mt-1">
              ราคารวม: <span className="font-bold text-primary text-lg">{formatPrice(totalPrice)}</span>
            </p>
          </div>

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'กำลังจอง...' : 'ยืนยันการจอง'}
          </button>
        </form>
      </div>
    </>
  );
}
