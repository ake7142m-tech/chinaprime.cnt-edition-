'use client';

import SEOHead from '@/components/SEOHead';
import Breadcrumb from '@/components/Breadcrumb';

export default function LoginPage() {
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Submit to cloud-functions/api/auth
  }

  return (
    <>
      <SEOHead title="เข้าสู่ระบบ" description="เข้าสู่ระบบสมาชิก" canonicalPath="/auth/login" />

      <div className="page-container max-w-md">
        <Breadcrumb items={[
          { label: 'หน้าแรก', href: '/' },
          { label: 'เข้าสู่ระบบ' },
        ]} />

        <h1 className="section-title">เข้าสู่ระบบ</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label-flat">อีเมล</label>
            <input type="email" className="input-flat w-full" required />
          </div>
          <div>
            <label className="label-flat">รหัสผ่าน</label>
            <input type="password" className="input-flat w-full" required />
          </div>
          <button type="submit" className="btn-primary w-full">เข้าสู่ระบบ</button>
        </form>

        <p className="font-thai text-sm text-neutral-500 mt-4 text-center">
          ยังไม่มีบัญชี? <a href="/auth/register" className="text-primary hover:underline">สมัครสมาชิก</a>
        </p>
      </div>
    </>
  );
}
