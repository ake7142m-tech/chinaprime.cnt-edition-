import SEOHead from '@/components/SEOHead';
import Breadcrumb from '@/components/Breadcrumb';

export default function ContactPage() {
  return (
    <>
      <SEOHead title="ติดต่อเรา" description="ข้อมูลติดต่อบริษัททัวร์ไทยแลนด์" canonicalPath="/contact" />

      <div className="page-container">
        <Breadcrumb items={[
          { label: 'หน้าแรก', href: '/' },
          { label: 'ติดต่อ' },
        ]} />

        <h1 className="section-title">ติดต่อเรา</h1>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Contact Info */}
          <div className="space-y-4">
            <div className="card-flat">
              <h3 className="font-thai font-bold text-base text-neutral-800 mb-2">ที่อยู่</h3>
              <p className="font-thai text-sm text-neutral-600">123 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110</p>
            </div>
            <div className="card-flat">
              <h3 className="font-thai font-bold text-base text-neutral-800 mb-2">โทรศัพท์</h3>
              <p className="font-thai text-sm text-neutral-600">02-123-4567</p>
            </div>
            <div className="card-flat">
              <h3 className="font-thai font-bold text-base text-neutral-800 mb-2">อีเมล</h3>
              <p className="font-thai text-sm text-neutral-600">info@tourthailand.com</p>
            </div>
            <div className="card-flat">
              <h3 className="font-thai font-bold text-base text-neutral-800 mb-2">LINE Official</h3>
              <p className="font-thai text-sm text-neutral-600">@tourthailand</p>
            </div>
            <div className="card-flat">
              <h3 className="font-thai font-bold text-base text-neutral-800 mb-2">เวลาทำการ</h3>
              <p className="font-thai text-sm text-neutral-600">จันทร์-ศุกร์ 09:00-18:00</p>
              <p className="font-thai text-sm text-neutral-600">เสาร์-อาทิตย์ 10:00-16:00</p>
            </div>
          </div>

          {/* Contact Form */}
          <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
            <div>
              <label className="label-flat">ชื่อ-นามสกุล</label>
              <input type="text" className="input-flat w-full" required />
            </div>
            <div>
              <label className="label-flat">เบอร์โทรศัพท์</label>
              <input type="tel" className="input-flat w-full" required />
            </div>
            <div>
              <label className="label-flat">อีเมล</label>
              <input type="email" className="input-flat w-full" required />
            </div>
            <div>
              <label className="label-flat">หัวข้อ</label>
              <select className="input-flat w-full">
                <option>สอบถามทัวร์</option>
                <option>แจ้งปัญหา</option>
                <option>ขอใบเสนอราคา</option>
                <option>อื่นๆ</option>
              </select>
            </div>
            <div>
              <label className="label-flat">รายละเอียด</label>
              <textarea rows={4} className="input-flat w-full" required />
            </div>
            <button type="submit" className="btn-primary w-full">ส่งข้อความ</button>
          </form>
        </div>
      </div>
    </>
  );
}
