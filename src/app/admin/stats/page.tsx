'use client';

import SEOHead from '@/components/SEOHead';
import Breadcrumb from '@/components/Breadcrumb';

export default function StatsPage() {
  // Sample stats - in production fetched from cloud-functions/api/stats
  const stats = {
    daily: 125,
    monthly: 3840,
    total: 45000,
    popularPages: [
      { page: '/tours', views: 850 },
      { page: '/tours/chiangmai-3d', views: 420 },
      { page: '/tours/phuket-4d', views: 380 },
      { page: '/', views: 310 },
      { page: '/news', views: 150 },
    ],
    popularTours: [
      { name: 'ทัวร์เชียงใหม่ 3 วัน', bookings: 45 },
      { name: 'ทัวร์ภูเก็ต 4 วัน', bookings: 32 },
      { name: 'ทัวร์กรุงเทพ 1 วัน', bookings: 28 },
    ],
    referrers: [
      { source: 'Google', count: 1200 },
      { source: 'Facebook', count: 800 },
      { source: 'TikTok', count: 450 },
      { source: 'LINE', count: 380 },
      { source: 'อื่นๆ', count: 210 },
    ],
    buttonClicks: [
      { button: 'จองทัวร์', clicks: 340 },
      { button: 'แชท', clicks: 220 },
      { button: 'โทร', clicks: 180 },
      { button: 'ดาวน์โหลด', clicks: 95 },
    ],
  };

  return (
    <>
      <SEOHead title="สถิติ" description="สถิติการเข้าชมและข้อมูลการใช้งาน" canonicalPath="/admin/stats" />

      <div className="page-container">
        <Breadcrumb items={[
          { label: 'หน้าแรก', href: '/' },
          { label: 'แผนกจัดการ', href: '/admin' },
          { label: 'สถิติ' },
        ]} />

        <h1 className="section-title">สถิติ</h1>

        {/* Visitor Counts */}
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <div className="card-flat text-center">
            <p className="font-thai text-sm text-neutral-500">วันนี้</p>
            <p className="font-thai font-bold text-2xl text-primary">{stats.daily}</p>
          </div>
          <div className="card-flat text-center">
            <p className="font-thai text-sm text-neutral-500">เดือนนี้</p>
            <p className="font-thai font-bold text-2xl text-primary">{stats.monthly}</p>
          </div>
          <div className="card-flat text-center">
            <p className="font-thai text-sm text-neutral-500">ทั้งหมด</p>
            <p className="font-thai font-bold text-2xl text-primary">{stats.total}</p>
          </div>
        </div>

        {/* Popular Pages */}
        <section className="mb-8">
          <h2 className="section-title">หน้ายอดนิยม</h2>
          <div className="card-flat">
            <table className="w-full font-thai text-sm">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="py-2 text-left text-neutral-600">หน้า</th>
                  <th className="py-2 text-right text-neutral-600">เข้าชม</th>
                </tr>
              </thead>
              <tbody>
                {stats.popularPages.map((p, i) => (
                  <tr key={i} className="border-b border-neutral-100">
                    <td className="py-2">{p.page}</td>
                    <td className="py-2 text-right">{p.views}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Popular Tours */}
        <section className="mb-8">
          <h2 className="section-title">ทัวร์ยอดนิยม</h2>
          <div className="card-flat">
            <table className="w-full font-thai text-sm">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="py-2 text-left text-neutral-600">ทัวร์</th>
                  <th className="py-2 text-right text-neutral-600">จอง</th>
                </tr>
              </thead>
              <tbody>
                {stats.popularTours.map((t, i) => (
                  <tr key={i} className="border-b border-neutral-100">
                    <td className="py-2">{t.name}</td>
                    <td className="py-2 text-right">{t.bookings}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Traffic Sources */}
        <section className="mb-8">
          <h2 className="section-title">แหล่งที่มา</h2>
          <div className="card-flat">
            <table className="w-full font-thai text-sm">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="py-2 text-left text-neutral-600">แหล่งที่มา</th>
                  <th className="py-2 text-right text-neutral-600">จำนวน</th>
                </tr>
              </thead>
              <tbody>
                {stats.referrers.map((r, i) => (
                  <tr key={i} className="border-b border-neutral-100">
                    <td className="py-2">{r.source}</td>
                    <td className="py-2 text-right">{r.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Button Clicks */}
        <section className="mb-8">
          <h2 className="section-title">การคลิกปุ่ม</h2>
          <div className="card-flat">
            <table className="w-full font-thai text-sm">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="py-2 text-left text-neutral-600">ปุ่ม</th>
                  <th className="py-2 text-right text-neutral-600">คลิก</th>
                </tr>
              </thead>
              <tbody>
                {stats.buttonClicks.map((b, i) => (
                  <tr key={i} className="border-b border-neutral-100">
                    <td className="py-2">{b.button}</td>
                    <td className="py-2 text-right">{b.clicks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  );
}
