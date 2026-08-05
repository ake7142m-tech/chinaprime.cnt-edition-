'use client';

import { useState } from 'react';
import SEOHead from '@/components/SEOHead';
import Breadcrumb from '@/components/Breadcrumb';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'เข้าสู่ระบบไม่สำเร็จ');
        return;
      }

      // Store token in cookie
      document.cookie = `auth_token=${data.token}; path=/; max-age=604800; SameSite=Lax`;

      // Store user info
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
      }

      // Redirect
      window.location.href = data.user?.role === 'admin' ? '/admin' : '/auth/profile';
    } catch {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
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

        {error && (
          <div className="card-flat mb-4 text-red-600 font-thai text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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
          <div>
            <label className="label-flat">รหัสผ่าน</label>
            <input
              type="password"
              className="input-flat w-full"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>

        <p className="font-thai text-sm text-neutral-500 mt-4 text-center">
          ยังไม่มีบัญชี? <a href="/auth/register" className="text-primary hover:underline">สมัครสมาชิก</a>
        </p>
      </div>
    </>
  );
}
