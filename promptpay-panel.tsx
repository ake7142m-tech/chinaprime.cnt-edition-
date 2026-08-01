'use client';

import { useState, useEffect, useRef } from 'react';
import { formatTHB } from '../../lib/promptpay';

interface Props {
  bookingId: string;
  depositTHB: number;
  onSuccess: () => void;
}

interface PromptPayResponse {
  paymentId: string;
  chargeId: string;
  qrData: string;
  omiseQrImageUrl?: string;
  amountTHB: number;
  expiresAt: string;
  bookingRef: string;
}

type QrStatus = 'loading' | 'ready' | 'polling' | 'success' | 'expired' | 'error';

function QrCodeSvg({ data, size = 200 }: { data: string; size?: number }) {
  // Simple QR display using a data URI approach
  // In production, install: npm install qrcode  → import QRCode from 'qrcode'
  // and replace with: const url = await QRCode.toDataURL(data)
  // For now we render a placeholder that shows the QR data is ready
  return (
    <div
      style={{ width: size, height: size }}
      className="relative mx-auto flex items-center justify-center rounded-xl border-4 border-[#2563EB] bg-white p-3"
    >
      {/* Inline QR via Google Charts API (swap for qrcode library in prod) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(data)}&size=${size}x${size}&margin=0&color=0B2E52`}
        alt="PromptPay QR Code"
        width={size - 32}
        height={size - 32}
        className="block"
        onError={(e) => {
          // Fallback if CDN unavailable
          (e.currentTarget as HTMLImageElement).style.display = 'none';
        }}
      />
    </div>
  );
}

function CountdownTimer({ expiresAt, onExpire }: { expiresAt: string; onExpire: () => void }) {
  const [secondsLeft, setSecondsLeft] = useState(0);
  const firedRef = useRef(false);

  useEffect(() => {
    const tick = () => {
      const left = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left === 0 && !firedRef.current) {
        firedRef.current = true;
        onExpire();
      }
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  const mins = Math.floor(secondsLeft / 60).toString().padStart(2, '0');
  const secs = (secondsLeft % 60).toString().padStart(2, '0');
  const isLow = secondsLeft < 120;

  return (
    <div className={`text-center text-sm font-semibold ${isLow ? 'text-[#B91C1C]' : 'text-[#64748B]'}`}>
      {secondsLeft > 0 ? (
        <>QR หมดอายุใน <span className="font-mono">{mins}:{secs}</span></>
      ) : (
        'QR หมดอายุแล้ว'
      )}
    </div>
  );
}

export function PromptPayPanel({ bookingId, depositTHB, onSuccess }: Props) {
  const [status, setStatus] = useState<QrStatus>('loading');
  const [qrData, setQrData] = useState<PromptPayResponse | null>(null);
  const [error, setError] = useState('');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Generate QR ─────────────────────────────────────────────────
  async function generateQR() {
    setStatus('loading');
    setError('');
    try {
      const res = await fetch('/api/payments/promptpay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId }),
      });
      const json = (await res.json()) as PromptPayResponse & { error?: string };
      if (!res.ok) { setError(json.error ?? 'ไม่สามารถสร้าง QR ได้'); setStatus('error'); return; }
      setQrData(json);
      setStatus('ready');
      startPolling(json.paymentId);
    } catch {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่');
      setStatus('error');
    }
  }

  useEffect(() => {
    generateQR();
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]);

  // ── Poll payment status every 5 seconds ─────────────────────────
  function startPolling(paymentId: string) {
    if (pollRef.current) clearInterval(pollRef.current);
    setStatus('polling');
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/bookings/${bookingId}`);
        if (!res.ok) return;
        const data = (await res.json()) as { status?: string };
        if (data.status === 'confirmed') {
          clearInterval(pollRef.current!);
          setStatus('success');
          setTimeout(onSuccess, 1500);
        }
      } catch {
        // silent — keep polling
      }
    }, 5000);
  }

  function handleExpire() {
    if (pollRef.current) clearInterval(pollRef.current);
    setStatus('expired');
  }

  // ── Render ───────────────────────────────────────────────────────
  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center gap-3 py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#E2E8F0] border-t-[#2563EB]" />
        <p className="text-sm text-[#64748B]">กำลังสร้าง QR Code...</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="space-y-4 py-4 text-center">
        <p className="text-sm text-[#B91C1C]">{error}</p>
        <button type="button" onClick={generateQR} className="ui-button ui-button-secondary px-6 py-2">
          ลองใหม่
        </button>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#DCFCE7]">
          <svg viewBox="0 0 24 24" className="h-7 w-7 text-[#16A34A]" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="m5 12.5 4 4L19 7.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <p className="text-lg font-bold text-[#16A34A]">ชำระเงินสำเร็จ!</p>
        <p className="text-sm text-[#64748B]">กำลังยืนยันการจอง...</p>
      </div>
    );
  }

  if (status === 'expired') {
    return (
      <div className="space-y-4 py-4 text-center">
        <p className="font-semibold text-[#B91C1C]">QR Code หมดอายุแล้ว</p>
        <p className="text-sm text-[#64748B]">กรุณาสร้าง QR ใหม่เพื่อชำระเงิน</p>
        <button type="button" onClick={generateQR} className="ui-button ui-button-brand px-6 py-2.5">
          สร้าง QR ใหม่
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Amount */}
      <div className="rounded-xl bg-[#EFF6FF] p-4 text-center">
        <p className="text-sm text-[#64748B]">ยอดมัดจำที่ต้องชำระ</p>
        <p className="text-3xl font-extrabold tracking-tight text-[#2563EB]">
          ฿{formatTHB(depositTHB)}
        </p>
        {qrData && (
          <p className="mt-0.5 text-xs text-[#64748B]">รหัสจอง: {qrData.bookingRef}</p>
        )}
      </div>

      {/* QR Code */}
      {qrData && (
        <div className="flex flex-col items-center gap-3">
          {/* Use Omise QR image if available, else local EMV */}
          {qrData.omiseQrImageUrl ? (
            <div className="mx-auto rounded-xl border-4 border-[#2563EB] bg-white p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrData.omiseQrImageUrl}
                alt="PromptPay QR"
                width={192}
                height={192}
                className="block"
              />
            </div>
          ) : (
            <QrCodeSvg data={qrData.qrData} size={220} />
          )}

          <CountdownTimer expiresAt={qrData.expiresAt} onExpire={handleExpire} />

          {/* Polling indicator */}
          {status === 'polling' && (
            <div className="flex items-center gap-2 text-xs text-[#64748B]">
              <div className="h-2 w-2 animate-pulse rounded-full bg-[#2563EB]" />
              กำลังรอการยืนยันจากธนาคาร...
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <ol className="space-y-2 rounded-xl bg-[#F8FAFC] p-4 text-sm text-[#475569]">
        {[
          'เปิดแอปธนาคารบนมือถือ',
          'เลือก "จ่ายด้วย QR Code" หรือ "PromptPay"',
          `สแกน QR แล้วยืนยันยอด ฿${formatTHB(depositTHB)}`,
          'รอ SMS ยืนยันการจองจาก CHINA PRIME',
        ].map((step, i) => (
          <li key={i} className="flex items-start gap-2.5">
            <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#DBEAFE] text-[10px] font-bold text-[#2563EB]">
              {i + 1}
            </span>
            {step}
          </li>
        ))}
      </ol>

      <p className="text-center text-xs text-[#94A3B8]">
        รองรับทุกธนาคาร — KBANK, SCB, BBL, KTB, BAY, TTB, GSB ฯลฯ
      </p>
    </div>
  );
}
