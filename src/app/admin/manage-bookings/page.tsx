'use client';

import { useState, useEffect, useCallback } from 'react';
import SEOHead from '@/components/SEOHead';
import Breadcrumb from '@/components/Breadcrumb';
import { formatPrice } from '@/lib/utils';

interface Booking {
  id: string;
  tourId: string;
  scheduleDate: string;
  travelerCount: number;
  totalPrice: number;
  status: string;
  createdAt: string;
  [key: string]: any;
}

const statusLabel: Record<string, string> = {
  pending: 'รอยืนยัน',
  confirmed: 'ยืนยันแล้ว',
  cancelled: 'ยกเลิก',
};

const statusColor: Record<string, string> = {
  pending: 'text-yellow-600',
  confirmed: 'text-green-600',
  cancelled: 'text-red-600',
};

export default function ManageBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    try {
      const res = await fetch('/api/bookings');
      const data = await res.json();
      setBookings(Array.isArray(data) ? data : []);
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  async function updateStatus(id: string, status: string) {
    setUpdating(id);
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'อัปเดตไม่สำเร็จ');
        return;
      }
      fetchBookings();
    } catch {
      alert('เกิดข้อผิดพลาด');
    } finally {
      setUpdating(null);
    }
  }

  return (
    <>
      <SEOHead title="จัดการการจอง" description="ยืนยัน/ยกเลิกการจอง" canonicalPath="/admin/manage-bookings" />

      <div className="page-container">
        <Breadcrumb items={[
          { label: 'หน้าแรก', href: '/' },
          { label: 'แผนกจัดการ', href: '/admin' },
          { label: 'จัดการการจอง' },
        ]} />

        <h1 className="section-title">จัดการการจอง</h1>

        {loading ? (
          <p className="font-thai text-sm text-neutral-500">กำลังโหลด...</p>
        ) : bookings.length === 0 ? (
          <p className="font-thai text-sm text-neutral-500">ยังไม่มีการจอง</p>
        ) : (
          <div className="card-flat overflow-x-auto">
            <table className="w-full font-thai text-sm">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="py-2 text-left text-neutral-600">ID ทัวร์</th>
                  <th className="py-2 text-left text-neutral-600">วันเดินทาง</th>
                  <th className="py-2 text-right text-neutral-600">จำนวน</th>
                  <th className="py-2 text-right text-neutral-600">ราคารวม</th>
                  <th className="py-2 text-left text-neutral-600">สถานะ</th>
                  <th className="py-2 text-left text-neutral-600">วันที่จอง</th>
                  <th className="py-2 text-right text-neutral-600">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id} className="border-b border-neutral-100">
                    <td className="py-2">{b.tourId}</td>
                    <td className="py-2">{b.scheduleDate}</td>
                    <td className="py-2 text-right">{b.travelerCount}</td>
                    <td className="py-2 text-right">{formatPrice(b.totalPrice)}</td>
                    <td className="py-2">
                      <span className={`font-bold ${statusColor[b.status] || ''}`}>
                        {statusLabel[b.status] || b.status}
                      </span>
                    </td>
                    <td className="py-2">{b.createdAt ? new Date(b.createdAt).toLocaleDateString('th-TH') : '-'}</td>
                    <td className="py-2 text-right space-x-2">
                      {b.status === 'pending' && (
                        <>
                          <button
                            onClick={() => updateStatus(b.id, 'confirmed')}
                            className="text-green-600 hover:underline text-xs"
                            disabled={updating === b.id}
                          >
                            ยืนยัน
                          </button>
                          <button
                            onClick={() => updateStatus(b.id, 'cancelled')}
                            className="text-red-600 hover:underline text-xs"
                            disabled={updating === b.id}
                          >
                            ยกเลิก
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
