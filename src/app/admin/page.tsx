import SEOHead from '@/components/SEOHead';
import Breadcrumb from '@/components/Breadcrumb';

export default function AdminPage() {
  return (
    <>
      <SEOHead title="แผนกจัดการ" description="แผนกจัดการเว็บไซต์" canonicalPath="/admin" />

      <div className="page-container">
        <Breadcrumb items={[
          { label: 'หน้าแรก', href: '/' },
          { label: 'แผนกจัดการ' },
        ]} />

        <h1 className="section-title">แผนกจัดการ</h1>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <a href="/admin/manage-tours" className="card-flat-hover block text-center">
            <h2 className="font-thai font-bold text-base text-neutral-800 mb-2">จัดการทัวร์</h2>
            <p className="font-thai text-sm text-neutral-500">เพิ่ม/แก้ไข/ลบทัวร์</p>
          </a>
          <a href="/admin/manage-content" className="card-flat-hover block text-center">
            <h2 className="font-thai font-bold text-base text-neutral-800 mb-2">จัดการเนื้อหา</h2>
            <p className="font-thai text-sm text-neutral-500">ข่าว/บทความ/รีวิว/แบนเนอร์</p>
          </a>
          <a href="/admin/stats" className="card-flat-hover block text-center">
            <h2 className="font-thai font-bold text-base text-neutral-800 mb-2">สถิติ</h2>
            <p className="font-thai text-sm text-neutral-500">ผู้เข้าชม/ทัวร์ยอดนิยม/การคลิก</p>
          </a>
          <a href="/admin/manage-bookings" className="card-flat-hover block text-center">
            <h2 className="font-thai font-bold text-base text-neutral-800 mb-2">จัดการการจอง</h2>
            <p className="font-thai text-sm text-neutral-500">ยืนยัน/ยกเลิกการจอง</p>
          </a>
          <a href="/admin/manage-users" className="card-flat-hover block text-center">
            <h2 className="font-thai font-bold text-base text-neutral-800 mb-2">จัดการสมาชิก</h2>
            <p className="font-thai text-sm text-neutral-500">ข้อมูลสมาชิก</p>
          </a>
        </div>
      </div>
    </>
  );
}
