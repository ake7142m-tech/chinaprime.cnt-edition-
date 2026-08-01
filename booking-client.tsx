'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { PromptPayPanel } from '../../components/booking/promptpay-panel';
import { CardPaymentForm } from '../../components/booking/card-payment-form';
import { SeatBadge } from '../../components/booking/seat-badge';
import { formatTHB } from '../../lib/promptpay';

// ── Types ──────────────────────────────────────────────────────────
interface TourInfo {
  slug: string;
  title: string;
  duration: string;
  image: string;
  priceValue: number;
  price: string;
}

interface DepartureOption {
  label: string;
  isoDate: string;
  price: string;
  availability: string;
  availableSeats: number;
  totalSeats: number;
}

interface Props {
  tour: TourInfo;
  departureDates: DepartureOption[];
  depositTHB: number;
}

type Step = 'details' | 'payment' | 'done';
type PaymentMethod = 'promptpay' | 'credit_card';

// ── Step indicator ─────────────────────────────────────────────────
function StepDots({ current }: { current: Step }) {
  const steps: Step[] = ['details', 'payment', 'done'];
  const labels = ['ข้อมูลผู้จอง', 'ชำระมัดจำ', 'ยืนยัน'];
  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                s === current
                  ? 'bg-[#2563EB] text-white'
                  : steps.indexOf(current) > i
                  ? 'bg-[#16A34A] text-white'
                  : 'bg-[#E2E8F0] text-[#94A3B8]'
              }`}
            >
              {steps.indexOf(current) > i ? '✓' : i + 1}
            </div>
            <span className={`mt-1 text-[11px] font-medium whitespace-nowrap ${
              s === current ? 'text-[#2563EB]' : 'text-[#94A3B8]'
            }`}>{labels[i]}</span>
          </div>
          {i < steps.length - 1 && (
            <div className={`h-0.5 w-10 mx-1 mb-5 ${
              steps.indexOf(current) > i ? 'bg-[#16A34A]' : 'bg-[#E2E8F0]'
            }`} />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────
export function BookingClient({ tour, departureDates, depositTHB }: Props) {
  const [step, setStep] = useState<Step>('details');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [selectedDate, setSelectedDate] = useState(departureDates[0]?.isoDate ?? '');
  const [passengerCount, setPassengerCount] = useState(1);
  const [leadName, setLeadName] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('promptpay');
  const [bookingId, setBookingId] = useState('');
  const [bookingRef, setBookingRef] = useState('');

  // Live seat count
  const [liveSeats, setLiveSeats] = useState<Record<string, number>>({});

  // Poll seat availability for selected date
  const pollSeats = useCallback(async (date: string) => {
    if (!date) return;
    try {
      const res = await fetch(`/api/seats?tourSlug=${tour.slug}&date=${date}`);
      if (res.ok) {
        const data = (await res.json()) as { availableSeats: number };
        setLiveSeats((prev) => ({ ...prev, [date]: data.availableSeats }));
      }
    } catch {
      // silent
    }
  }, [tour.slug]);

  useEffect(() => {
    if (selectedDate) {
      pollSeats(selectedDate);
      const interval = setInterval(() => pollSeats(selectedDate), 30_000);
      return () => clearInterval(interval);
    }
  }, [selectedDate, pollSeats]);

  const selectedDeparture = departureDates.find((d) => d.isoDate === selectedDate);
  const availableSeats = liveSeats[selectedDate] ?? selectedDeparture?.availableSeats ?? 20;
  const totalTHB = tour.priceValue * passengerCount;
  const actualDepositTHB = depositTHB * passengerCount;

  // ── Step 1: Submit details → create booking ────────────────────
  async function handleSubmitDetails(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!selectedDate) { setError('กรุณาเลือกวันเดินทาง'); return; }
    if (passengerCount > availableSeats) {
      setError(`เหลือที่นั่งเพียง ${availableSeats} ที่ — กรุณาลดจำนวนผู้โดยสาร`);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tourSlug: tour.slug,
          tourTitle: tour.title,
          departureDate: selectedDate,
          leadName: leadName.trim(),
          leadPhone: leadPhone.trim(),
          leadEmail: leadEmail.trim(),
          passengerCount,
          specialRequests: specialRequests.trim(),
          pricePerPerson: tour.priceValue,
          depositAmount: actualDepositTHB,
          totalAmount: totalTHB,
        }),
      });
      const json = (await res.json()) as { booking?: { id: string; bookingRef: string }; error?: string };
      if (!res.ok) { setError(json.error ?? 'เกิดข้อผิดพลาด'); return; }
      setBookingId(json.booking!.id);
      setBookingRef(json.booking!.bookingRef);
      setStep('payment');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  }

  function handlePaymentSuccess() {
    setStep('done');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <main className="min-h-screen bg-[#F5F7FB] text-[#17324D]">
      <div className="ui-section py-6 lg:py-10">
        {/* Back link */}
        <Link
          href={`/join-tours/${tour.slug}`}
          className="mb-5 inline-flex items-center gap-1.5 text-sm text-[#2563EB] hover:underline"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          กลับไปหน้าทัวร์
        </Link>

        <div className="mx-auto max-w-3xl">
          <StepDots current={step} />

          {/* ── Tour summary card ─────────────────────────── */}
          <div className="ui-card mb-5 flex items-center gap-4 overflow-hidden p-0">
            <div className="relative h-20 w-24 flex-shrink-0 sm:h-24 sm:w-32">
              <Image
                src={tour.image}
                alt={tour.title}
                fill
                className="object-cover"
                sizes="128px"
              />
            </div>
            <div className="min-w-0 flex-1 py-3 pr-4">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-[#2563EB]">จอยทัวร์จีน</p>
              <h1 className="mt-0.5 line-clamp-2 text-base font-bold leading-snug text-[#17324D] sm:text-lg">
                {tour.title}
              </h1>
              <p className="mt-1 text-sm text-[#64748B]">{tour.duration}</p>
            </div>
          </div>

          {/* ── Step 1: Passenger details ────────────────── */}
          {step === 'details' && (
            <form onSubmit={handleSubmitDetails} className="space-y-4">
              {/* Departure date */}
              <div className="ui-card p-5">
                <h2 className="mb-3 text-base font-bold text-[#17324D]">เลือกวันเดินทาง</h2>
                {departureDates.length === 0 ? (
                  <p className="text-sm text-[#64748B]">ไม่มีรอบเดินทางที่เปิดจองในขณะนี้</p>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {departureDates.map((dep) => {
                      const seats = liveSeats[dep.isoDate] ?? dep.availableSeats;
                      const soldOut = seats === 0;
                      return (
                        <label
                          key={dep.isoDate}
                          className={`flex cursor-pointer items-center justify-between rounded-xl border-2 p-3.5 transition-colors ${
                            selectedDate === dep.isoDate
                              ? 'border-[#2563EB] bg-[#EFF6FF]'
                              : soldOut
                              ? 'cursor-not-allowed border-[#E2E8F0] bg-[#F8FAFC] opacity-60'
                              : 'border-[#E2E8F0] bg-white hover:border-[#93C5FD]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <input
                              type="radio"
                              name="departureDate"
                              value={dep.isoDate}
                              checked={selectedDate === dep.isoDate}
                              onChange={() => setSelectedDate(dep.isoDate)}
                              disabled={soldOut}
                              className="accent-[#2563EB]"
                            />
                            <span className="text-sm font-semibold text-[#17324D]">{dep.label}</span>
                          </div>
                          <SeatBadge availableSeats={seats} />
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Passengers */}
              <div className="ui-card p-5">
                <h2 className="mb-3 text-base font-bold text-[#17324D]">จำนวนผู้โดยสาร</h2>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setPassengerCount(Math.max(1, passengerCount - 1))}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-[#E2E8F0] text-xl font-bold text-[#64748B] hover:border-[#2563EB] hover:text-[#2563EB]"
                  >−</button>
                  <span className="w-8 text-center text-lg font-bold">{passengerCount}</span>
                  <button
                    type="button"
                    onClick={() => setPassengerCount(Math.min(availableSeats, passengerCount + 1))}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-[#E2E8F0] text-xl font-bold text-[#64748B] hover:border-[#2563EB] hover:text-[#2563EB]"
                  >+</button>
                  <span className="text-sm text-[#64748B]">ท่าน (เหลือ {availableSeats} ที่)</span>
                </div>
              </div>

              {/* Contact info */}
              <div className="ui-card p-5">
                <h2 className="mb-4 text-base font-bold text-[#17324D]">ข้อมูลผู้ติดต่อ</h2>
                <div className="space-y-3">
                  <div className="ui-field">
                    <label className="ui-field-label" htmlFor="leadName">ชื่อ-นามสกุล <span className="text-[#E11D2A]">*</span></label>
                    <input
                      id="leadName"
                      type="text"
                      className="ui-input"
                      placeholder="กรอกชื่อ-นามสกุลผู้จอง"
                      value={leadName}
                      onChange={(e) => setLeadName(e.target.value)}
                      required
                      autoComplete="name"
                    />
                  </div>
                  <div className="ui-field">
                    <label className="ui-field-label" htmlFor="leadPhone">เบอร์โทรศัพท์ <span className="text-[#E11D2A]">*</span></label>
                    <input
                      id="leadPhone"
                      type="tel"
                      className="ui-input"
                      placeholder="0812345678"
                      value={leadPhone}
                      onChange={(e) => setLeadPhone(e.target.value)}
                      required
                      autoComplete="tel"
                      pattern="[0-9]{9,10}"
                    />
                    <p className="ui-field-hint">จะใช้ส่ง SMS ยืนยันการจอง</p>
                  </div>
                  <div className="ui-field">
                    <label className="ui-field-label" htmlFor="leadEmail">อีเมล</label>
                    <input
                      id="leadEmail"
                      type="email"
                      className="ui-input"
                      placeholder="your@email.com (ไม่บังคับ)"
                      value={leadEmail}
                      onChange={(e) => setLeadEmail(e.target.value)}
                      autoComplete="email"
                    />
                  </div>
                  <div className="ui-field">
                    <label className="ui-field-label" htmlFor="specialRequests">คำร้องพิเศษ</label>
                    <textarea
                      id="specialRequests"
                      className="ui-textarea"
                      rows={2}
                      placeholder="ห้องพักเดี่ยว, อาหารพิเศษ, ฯลฯ (ไม่บังคับ)"
                      value={specialRequests}
                      onChange={(e) => setSpecialRequests(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Price summary */}
              <PriceSummary
                pricePerPerson={tour.priceValue}
                passengerCount={passengerCount}
                totalTHB={totalTHB}
                depositTHB={actualDepositTHB}
              />

              {error && (
                <div className="rounded-xl border border-[#F8CACA] bg-[#FEE2E2] p-3 text-sm text-[#B91C1C]">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || departureDates.length === 0}
                className="ui-button ui-button-brand w-full py-3 text-base"
              >
                {loading ? 'กำลังดำเนินการ...' : 'ถัดไป — เลือกวิธีชำระเงิน →'}
              </button>

              <p className="text-center text-xs text-[#94A3B8]">
                การกดปุ่มนี้จะล็อกที่นั่งชั่วคราว 30 นาที เพื่อให้คุณชำระมัดจำ
              </p>
            </form>
          )}

          {/* ── Step 2: Payment ───────────────────────────── */}
          {step === 'payment' && (
            <div className="space-y-4">
              <PriceSummary
                pricePerPerson={tour.priceValue}
                passengerCount={passengerCount}
                totalTHB={totalTHB}
                depositTHB={actualDepositTHB}
                compact
              />

              {/* Payment method tabs */}
              <div className="ui-card overflow-hidden p-0">
                <div className="flex border-b border-[#E2E8F0]">
                  {(['promptpay', 'credit_card'] as PaymentMethod[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPaymentMethod(m)}
                      className={`flex flex-1 items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors ${
                        paymentMethod === m
                          ? 'border-b-2 border-[#2563EB] text-[#2563EB]'
                          : 'text-[#64748B] hover:text-[#17324D]'
                      }`}
                    >
                      {m === 'promptpay' ? (
                        <><span>📱</span> PromptPay QR</>
                      ) : (
                        <><span>💳</span> บัตรเครดิต</>
                      )}
                    </button>
                  ))}
                </div>

                <div className="p-5">
                  {paymentMethod === 'promptpay' ? (
                    <PromptPayPanel
                      bookingId={bookingId}
                      depositTHB={actualDepositTHB}
                      onSuccess={handlePaymentSuccess}
                    />
                  ) : (
                    <CardPaymentForm
                      bookingId={bookingId}
                      depositTHB={actualDepositTHB}
                      onSuccess={handlePaymentSuccess}
                    />
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => { setStep('details'); setError(''); }}
                className="w-full text-center text-sm text-[#64748B] hover:text-[#17324D] underline"
              >
                ← แก้ไขข้อมูล
              </button>
            </div>
          )}

          {/* ── Step 3: Done ──────────────────────────────── */}
          {step === 'done' && (
            <div className="ui-card p-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#DCFCE7]">
                <svg viewBox="0 0 24 24" className="h-8 w-8 text-[#16A34A]" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="m5 12.5 4 4L19 7.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-[#17324D]">ชำระมัดจำสำเร็จ!</h2>
              <p className="mt-2 text-[#64748B]">รหัสการจอง: <strong className="text-[#17324D]">{bookingRef}</strong></p>
              <p className="mt-1 text-sm text-[#64748B]">
                ระบบส่ง SMS ยืนยันไปที่ <strong>{leadPhone}</strong> แล้ว
              </p>
              <div className="mt-6 rounded-xl bg-[#F0F5FF] p-4 text-sm text-[#1D4ED8]">
                ทีมงาน China Prime จะติดต่อกลับภายใน 24 ชั่วโมง
                เพื่อประสานงานรายละเอียดการเดินทาง
              </div>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Link href={`/join-tours/${tour.slug}`} className="ui-button ui-button-secondary px-6 py-2.5">
                  กลับหน้าทัวร์
                </Link>
                <Link href="/join-tours" className="ui-button ui-button-primary px-6 py-2.5">
                  ดูทัวร์อื่น
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

// ── Price summary sub-component ────────────────────────────────────
function PriceSummary({
  pricePerPerson, passengerCount, totalTHB, depositTHB, compact = false,
}: {
  pricePerPerson: number;
  passengerCount: number;
  totalTHB: number;
  depositTHB: number;
  compact?: boolean;
}) {
  return (
    <div className={`ui-card-soft ${compact ? 'p-4' : 'p-5'}`}>
      {!compact && <h2 className="mb-3 text-base font-bold text-[#17324D]">สรุปราคา</h2>}
      <div className="space-y-1.5 text-sm">
        <div className="flex justify-between text-[#64748B]">
          <span>ราคาต่อท่าน</span>
          <span>฿{formatTHB(pricePerPerson)}</span>
        </div>
        <div className="flex justify-between text-[#64748B]">
          <span>จำนวน {passengerCount} ท่าน</span>
          <span>฿{formatTHB(totalTHB)}</span>
        </div>
        <div className="my-2 border-t border-[#E2E8F0]" />
        <div className="flex justify-between font-semibold text-[#17324D]">
          <span>ราคารวมทั้งหมด</span>
          <span className="text-[#E11D2A]">฿{formatTHB(totalTHB)}</span>
        </div>
        <div className="flex justify-between font-bold text-[#17324D]">
          <span>มัดจำที่ต้องชำระตอนนี้ (30%)</span>
          <span className="text-lg text-[#2563EB]">฿{formatTHB(depositTHB)}</span>
        </div>
        <p className="mt-1 text-xs text-[#94A3B8]">ส่วนที่เหลือ ฿{formatTHB(totalTHB - depositTHB)} ชำระก่อนเดินทาง</p>
      </div>
    </div>
  );
}
