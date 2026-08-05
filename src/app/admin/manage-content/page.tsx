'use client';

import { useState, useEffect, useCallback } from 'react';
import SEOHead from '@/components/SEOHead';
import Breadcrumb from '@/components/Breadcrumb';

interface ContentItem {
  id: string;
  type: string;
  title: string;
  body: string;
  image: string;
  author: string;
  [key: string]: any;
}

const emptyContent = {
  title: '', type: 'news', body: '', image: '', author: '',
};

const CONTENT_TYPES = ['news', 'article', 'review', 'banner'] as const;

export default function ManageContentPage() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ContentItem | null>(null);
  const [form, setForm] = useState(emptyContent);
  const [saving, setSaving] = useState(false);

  const fetchContent = useCallback(async () => {
    try {
      const url = typeFilter ? `/api/content?type=${typeFilter}` : '/api/content';
      const res = await fetch(url);
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [typeFilter]);

  useEffect(() => { fetchContent(); }, [fetchContent]);

  function openAdd() {
    setEditing(null);
    setForm(emptyContent);
    setShowForm(true);
  }

  function openEdit(item: ContentItem) {
    setEditing(item);
    setForm({ ...item });
    setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editing ? `/api/content/${editing.id}` : '/api/content';
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
      fetchContent();
    } catch {
      alert('เกิดข้อผิดพลาด');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('ยืนยันลบเนื้อหา?')) return;
    try {
      const res = await fetch(`/api/content/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'ลบไม่สำเร็จ');
        return;
      }
      fetchContent();
    } catch {
      alert('เกิดข้อผิดพลาด');
    }
  }

  const typeLabel: Record<string, string> = {
    news: 'ข่าว', article: 'บทความ', review: 'รีวิว', banner: 'แบนเนอร์',
  };

  return (
    <>
      <SEOHead title="จัดการเนื้อหา" description="จัดการข่าว/บทความ/รีวิว/แบนเนอร์" canonicalPath="/admin/manage-content" />

      <div className="page-container">
        <Breadcrumb items={[
          { label: 'หน้าแรก', href: '/' },
          { label: 'แผนกจัดการ', href: '/admin' },
          { label: 'จัดการเนื้อหา' },
        ]} />

        <div className="flex items-center justify-between mb-4">
          <h1 className="section-title mb-0">จัดการเนื้อหา</h1>
          <button onClick={openAdd} className="btn-primary text-sm">+ เพิ่มเนื้อหา</button>
        </div>

        {/* Type Filter */}
        <div className="flex gap-2 mb-4 flex-wrap">
          <button
            onClick={() => setTypeFilter('')}
            className={`text-sm px-3 py-1 rounded font-thai ${!typeFilter ? 'btn-primary' : 'btn-outline'}`}
          >
            ทั้งหมด
          </button>
          {CONTENT_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`text-sm px-3 py-1 rounded font-thai ${typeFilter === t ? 'btn-primary' : 'btn-outline'}`}
            >
              {typeLabel[t]}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="font-thai text-sm text-neutral-500">กำลังโหลด...</p>
        ) : items.length === 0 ? (
          <p className="font-thai text-sm text-neutral-500">ยังไม่มีเนื้อหา</p>
        ) : (
          <div className="card-flat overflow-x-auto">
            <table className="w-full font-thai text-sm">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="py-2 text-left text-neutral-600">ชื่อ</th>
                  <th className="py-2 text-left text-neutral-600">ประเภท</th>
                  <th className="py-2 text-left text-neutral-600">ผู้เขียน</th>
                  <th className="py-2 text-right text-neutral-600">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-neutral-100">
                    <td className="py-2">{item.title}</td>
                    <td className="py-2">{typeLabel[item.type] || item.type}</td>
                    <td className="py-2">{item.author || '-'}</td>
                    <td className="py-2 text-right space-x-2">
                      <button onClick={() => openEdit(item)} className="text-primary hover:underline text-xs">แก้ไข</button>
                      <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:underline text-xs">ลบ</button>
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
              <h2 className="font-thai font-bold text-lg mb-4">{editing ? 'แก้ไขเนื้อหา' : 'เพิ่มเนื้อหา'}</h2>
              <form onSubmit={handleSave} className="space-y-3">
                <div>
                  <label className="label-flat">ชื่อเรื่อง</label>
                  <input className="input-flat w-full" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                </div>
                <div>
                  <label className="label-flat">ประเภท</label>
                  <select className="input-flat w-full" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                    {CONTENT_TYPES.map((t) => (
                      <option key={t} value={t}>{typeLabel[t]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label-flat">เนื้อหา</label>
                  <textarea className="input-flat w-full" rows={5} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
                </div>
                <div>
                  <label className="label-flat">รูปภาพ URL</label>
                  <input className="input-flat w-full" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} />
                </div>
                <div>
                  <label className="label-flat">ผู้เขียน</label>
                  <input className="input-flat w-full" value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} />
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
