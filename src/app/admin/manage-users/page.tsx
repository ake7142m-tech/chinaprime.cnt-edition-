'use client';

import { useState, useEffect, useCallback } from 'react';
import SEOHead from '@/components/SEOHead';
import Breadcrumb from '@/components/Breadcrumb';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
  [key: string]: any;
}

export default function ManageUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    try {
      // Get auth token from cookie
      const tokenMatch = document.cookie.match(/auth_token=([^;]+)/);
      const token = tokenMatch?.[1] || '';

      const res = await fetch('/api/auth', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  return (
    <>
      <SEOHead title="จัดการสมาชิก" description="ข้อมูลสมาชิก" canonicalPath="/admin/manage-users" />

      <div className="page-container">
        <Breadcrumb items={[
          { label: 'หน้าแรก', href: '/' },
          { label: 'แผนกจัดการ', href: '/admin' },
          { label: 'จัดการสมาชิก' },
        ]} />

        <h1 className="section-title">จัดการสมาชิก</h1>

        {loading ? (
          <p className="font-thai text-sm text-neutral-500">กำลังโหลด...</p>
        ) : users.length === 0 ? (
          <p className="font-thai text-sm text-neutral-500">ยังไม่มีสมาชิก</p>
        ) : (
          <div className="card-flat overflow-x-auto">
            <table className="w-full font-thai text-sm">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="py-2 text-left text-neutral-600">ID</th>
                  <th className="py-2 text-left text-neutral-600">ชื่อ</th>
                  <th className="py-2 text-left text-neutral-600">อีเมล</th>
                  <th className="py-2 text-left text-neutral-600">เบอร์โทร</th>
                  <th className="py-2 text-left text-neutral-600">วันที่สมัคร</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-neutral-100">
                    <td className="py-2 text-neutral-500 text-xs">{u.id}</td>
                    <td className="py-2">{u.name}</td>
                    <td className="py-2">{u.email}</td>
                    <td className="py-2">{u.phone || '-'}</td>
                    <td className="py-2">{u.createdAt ? new Date(u.createdAt).toLocaleDateString('th-TH') : '-'}</td>
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
