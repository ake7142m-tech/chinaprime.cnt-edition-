'use client';

import { useState, useEffect, useCallback } from 'react';
import SEOHead from '@/components/SEOHead';
import Breadcrumb from '@/components/Breadcrumb';
import { formatPrice } from '@/lib/utils';

interface Tour {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  duration: string;
  category: string;
  region: string;
  image: string;
  seatsAvailable: number;
  [key: string]: any;
}

const emptyTour = {
  title: '', slug: '', description: '', price: 0, duration: '', category: '', region: '', image: '', seatsAvailable: 0,
};

export default function ManageToursPage() {
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Tour | null>(null);
  const [form, setForm] = useState(emptyTour);
  const [saving, setSaving] = useState(false);

  const fetchTours = useCallback(async () => {
    try {
      const res = await fetch('/api/tours');
      const data = await res.json();
      setTours(Array.isArray(data) ? data : []);
    } catch {
      setTours([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTours(); }, [fetchTours]);

  function openAdd() {
    setEditing(null);
    setForm(emptyTour);
    setShowForm(true);
  }

  function openEdit(tour: Tour) {
    setEditing(tour);
    setForm({ ...tour });
    setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editing ? `/api/tours/${editing.id}` : '/api/tours';
      const method = editing ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'บันทึกไม่สำเร็จ');
        return;
      }
      setShowForm(false);
      fetchTours();
    } catch {
      alert('เกิดข้อผิดพลาด');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('ยืนยันลบทัวร์?')) return;
    try {
      const res = await fetch(`/api/tours/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'ลบไม่สำเร็จ');
        return;
      }
      fetchTours();
    } catch {
      alert('เกิดข้อผิดพลาด');
    }
  }

  return (
    <>
      <SEOHead title="จัดการทัวร์" description="เพิ่ม/แก้ไข/ลบทัวร์" canonicalPath="/admin/manage-tours" />

      <div className="page-container">
        <Breadcrumb items={[
          { label: 'หน้าแรก', href: '/' },
          { label: 'แผนกจัดการ', href: '/admin' },
          { label: 'จัดการทัวร์' },
        ]} />

        <div className="flex items-center justify-between mb-4">
          <h1 className="section-title mb-0">จัดการทัวร์</h1>
          <button onClick={openAdd} className="btn-primary text-sm">+ เพิ่มทัวร์</button>
        </div>

        {loading ? (
          <p className="font-thai text-sm text-neutral-500">กำลังโหลด...</p>
        ) : tours.length === 0 ? (
          <p className="font-thai text-sm text-neutral-500">ยังไม่มีทัวร์</p>
        ) : (
          <div className="card-flat overflow-x-auto">
            <table className="w-full font-thai text-sm">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="py-2 text-left text-neutral-600">ชื่อทัวร์</th>
                  <th className="py-2 text-left text-neutral-600">หมวด</th>
                  <th className="py-2 text-left text-neutral-600">ภูมิภาค</th>
                  <th className="py-2 text-right text-neutral-600">ราคา</th>
                  <th className="py-2 text-right text-neutral-600">ที่นั่ง</th>
                  <th className="py-2 text-right text-neutral-600">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {tours.map((t) => (
                  <tr key={t.id} className="border-b border-neutral-100">
                    <td className="py-2">{t.title}</td>
                    <td className="py-2">{t.category}</td>
                    <td className="py-2">{t.region}</td>
                    <td className="py-2 text-right">{formatPrice(t.price)}</td>
                    <td className="py-2 text-right">{t.seatsAvailable}</td>
                    <td className="py-2 text-right space-x-2">
                      <button onClick={() => openEdit(t)} className="text-primary hover:underline text-xs">แก้ไข</button>
                      <button onClick={() => handleDelete(t.id)} className="text-red-600 hover:underline text-xs">ลบ</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 z-40 bg-black/30 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
              <h2 className="font-thai font-bold text-lg mb-4">{editing ? 'แก้ไขทัวร์' : 'เพิ่มทัวร์'}</h2>
              <form onSubmit={handleSave} className="space-y-3">
                <div>
                  <label className="label-flat">ชื่อทัวร์</label>
                  <input className="input-flat w-full" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                </div>
                <div>
                  <label className="label-flat">Slug</label>
                  <input className="input-flat w-full" required value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
                </div>
                <div>
                  <label className="label-flat">รายละเอียด</label>
                  <textarea className="input-flat w-full" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label-flat">ราคา</label>
                    <input type="number" className="input-flat w-full" required value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
                  </div>
                  <div>
                    <label className="label-flat">ระยะเวลา</label>
                    <input className="input-flat w-full" required value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label-flat">หมวดหมู่</label>
                    <input className="input-flat w-full" required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
                  </div>
                  <div>
                    <label className="label-flat">ภูมิภาค</label>
                    <input className="input-flat w-full" required value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label-flat">ที่นั่งว่าง</label>
                    <input type="number" className="input-flat w-full" value={form.seatsAvailable} onChange={(e) => setForm({ ...form, seatsAvailable: Number(e.target.value) })} />
                  </div>
                  <div>
                    <label className="label-flat">รูปภาพ URL</label>
                    <input className="input-flat w-full" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="submit" className="btn-primary text-sm" disabled={saving}>{saving ? 'กำลังบันทึก...' : 'บันทึก'}</button>
                  <button type="button" className="btn-outline text-sm" onClick={() => setShowForm(false)}>ยกเลิก</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
