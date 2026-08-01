'use client';

import SEOHead from '@/components/SEOHead';
import Breadcrumb from '@/components/Breadcrumb';

export default function RegisterPage() {
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Submit to cloud-functions/api/auth
  }

  return (
    <>
      <SEOHead title="สมัครสมาชิก" description="สมัครสมาชิกใหม่" canonicalPath="/auth/register" />

      <div className="page-container max-w-md">
        <Breadcrumb items={[
          { label: 'หน้าแรก', href: '/' },
          { label: 'สมัครสมาชิก' },
        ]} />

        <h1 className="section-title">สมัครสมาชิก</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
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
            <label className="label-flat">รหัสผ่าน</label>
            <input type="password" className="input-flat w-full" required minLength={6} />
          </div>
          <div>
            <label className="label-flat">ยืนยันรหัสผ่าน</label>
            <input type="password" className="input-flat w-full" required minLength={6} />
          </div>
          <button type="submit" className="btn-primary w-full">สมัครสมาชิก</button>
        </form>

        <p className="font-thai text-sm text-neutral-500 mt-4 text-center">
          มีบัญชีอยู่แล้ว? <a href="/auth/login" className="text-primary hover:underline">เข้าสู่ระบบ</a>
        </p>
      </div>
    </>
  );
}
