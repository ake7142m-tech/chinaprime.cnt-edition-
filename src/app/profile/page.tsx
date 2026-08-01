import SEOHead from '@/components/SEOHead';
import Breadcrumb from '@/components/Breadcrumb';
import { formatDate, formatPrice } from '@/lib/utils';
import type { Booking } from '@/lib/constants';

// Sample booking data - in production fetched from cloud-functions/api/bookings
const bookings: Booking[] = [
  {
    id: '1', tourId: '1', userId: 'u1',
    scheduleDate: '2024-04-10', travelerCount: 2, totalPrice: 7000,
    status: 'confirmed', createdAt: '2024-03-01',
  },
  {
    id: '2', tourId: '3', userId: 'u1',
    scheduleDate: '2024-05-01', travelerCount: 1, totalPrice: 5900,
    status: 'pending', createdAt: '2024-03-05',
  },
];

const statusLabel: Record<string, string> = {
  pending: 'รอยืนยัน',
  confirmed: 'ยืนยันแล้ว',
  cancelled: 'ยกเลิก',
};

export default function ProfilePage() {
  return (
    <>
      <SEOHead title="โปรไฟล์" description="ข้อมูลสมาชิกและประวัติการจอง" canonicalPath="/profile" />

      <div className="page-container">
        <Breadcrumb items={[
          { label: 'หน้าแรก', href: '/' },
          { label: 'โปรไฟล์' },
        ]} />

        <h1 className="section-title">โปรไฟล์สมาชิก</h1>

        {/* User Info */}
        <div className="card-flat mb-6">
          <h2 className="font-thai font-bold text-base text-neutral-800 mb-3">ข้อมูลส่วนตัว</h2>
          <div className="grid sm:grid-cols-2 gap-2 font-thai text-sm">
            <p className="text-neutral-500">ชื่อ:</p><p className="text-neutral-800">สมชาย ใจดี</p>
            <p className="text-neutral-500">อีเมล:</p><p className="text-neutral-800">somchai@email.com</p>
            <p className="text-neutral-500">เบอร์โทร:</p><p className="text-neutral-800">081-234-5678</p>
          </div>
        </div>

        {/* Booking History */}
        <h2 className="section-title">ประวัติการจอง</h2>
        <div className="space-y-4">
          {bookings.map((b) => (
            <div key={b.id} className="card-flat">
              <div className="flex justify-between items-start mb-2">
                <span className="font-thai font-bold text-base text-neutral-800">ทัวร์ #{b.tourId}</span>
                <span className="font-thai text-sm px-3 py-1 rounded bg-neutral-200">{statusLabel[b.status]}</span>
              </div>
              <div className="font-thai text-sm text-neutral-600 space-y-1">
                <p>วันเดินทาง: {formatDate(b.scheduleDate)}</p>
                <p>จำนวนคน: {b.travelerCount}</p>
                <p>ราคารวม: {formatPrice(b.totalPrice)}</p>
                <p>จองวันที่: {formatDate(b.createdAt)}</p>
              </div>
              {b.status === 'confirmed' && (
                <a href="#" className="btn-outline text-sm mt-2 inline-block" onClick={() => { if (typeof window !== 'undefined' && (window as unknown as Record<string, unknown>).__trackClick) { ((window as unknown as Record<string, unknown>).__trackClick as Function)('download', `booking-${b.id}`); } }}>
                  ดาวน์โหลดใบยืนยัน
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
