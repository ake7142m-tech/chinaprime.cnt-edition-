'use client';

import { useState } from 'react';
import SEOHead from '@/components/SEOHead';
import Breadcrumb from '@/components/Breadcrumb';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('รหัสผ่านไม่ตรงกัน');
      return;
    }

    setLoading(true);

    try {
      // Register
      const regRes = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, password }),
      });

      const regData = await regRes.json();

      if (!regRes.ok) {
        setError(regData.error || 'สมัครสมาชิกไม่สำเร็จ');
        return;
      }

      // Auto-login
      const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const loginData = await loginRes.json();

      if (!loginRes.ok) {
        // Registration succeeded but auto-login failed, redirect to login
        window.location.href = '/auth/login';
        return;
      }

      // Store token
      document.cookie = `auth_token=${loginData.token}; path=/; max-age=604800; SameSite=Lax`;

      if (loginData.user) {
        localStorage.setItem('user', JSON.stringify(loginData.user));
      }

      window.location.href = '/';
    } catch {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
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

        {error && (
          <div className="card-flat mb-4 text-red-600 font-thai text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div>
            <label className="label-flat">ยืนยันรหัสผ่าน</label>
            <input
              type="password"
              className="input-flat w-full"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'กำลังสมัครสมาชิก...' : 'สมัครสมาชิก'}
          </button>
        </form>

        <p className="font-thai text-sm text-neutral-500 mt-4 text-center">
          มีบัญชีอยู่แล้ว? <a href="/auth/login" className="text-primary hover:underline">เข้าสู่ระบบ</a>
        </p>
      </div>
    </>
  );
}
