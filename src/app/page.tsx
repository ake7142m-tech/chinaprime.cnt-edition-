import SEOHead from '@/components/SEOHead';
import TourCard from '@/components/TourCard';
import { SITE_NAME, SITE_DESCRIPTION } from '@/lib/constants';
import type { Tour, ContentItem } from '@/lib/constants';

// Sample data - in production this would come from KV
const featuredTours: Tour[] = [
  {
    id: '1', title: 'ทัวร์เชียงใหม่ 3 วัน', slug: 'chiangmai-3d',
    description: 'ทัวร์เชียงใหม่ 3 วัน ชมดอยสุเทพ วัดพระสิงห์ ตลาดนัดเชียงใหม่',
    itinerary: ['ดอยสุเทพ', 'วัดพระสิงห์', 'ตลาดนัดเชียงใหม่'],
    price: 3500, duration: '3 วัน', category: 'ภาคเหนือ', region: 'เชียงใหม่',
    image: '', seatsAvailable: 15, schedules: [],
  },
  {
    id: '2', title: 'ทัวร์กรุงเทพ 1 วัน', slug: 'bangkok-1d',
    description: 'ทัวร์กรุงเทพ 1 วัน ชมวัดพระแก้ว เรือไทย ตลาดนัดจตุจักร',
    itinerary: ['วัดพระแก้ว', 'เรือไทย', 'ตลาดนัดจตุจักร'],
    price: 1200, duration: '1 วัน', category: 'ภาคกลาง', region: 'กรุงเทพ',
    image: '', seatsAvailable: 30, schedules: [],
  },
  {
    id: '3', title: 'ทัวร์ภูเก็ต 4 วัน', slug: 'phuket-4d',
    description: 'ทัวร์ภูเก็ต 4 วัน ชมหาดป่าตอง เกาะพีพี ถนนบางลา',
    itinerary: ['หาดป่าตอง', 'เกาะพีพี', 'ถนนบางลา'],
    price: 5900, duration: '4 วัน', category: 'ภาคใต้', region: 'ภูเก็ต',
    image: '', seatsAvailable: 8, schedules: [],
  },
];

const newsItems: ContentItem[] = [
  { id: '1', type: 'news', title: 'เปิดทัวร์ใหม่ ภูเก็ต ฤดูร้อน', body: 'เปิดรับจองทัวร์ภูเก็ต 4 วัน ฤดูร้อน ราคาพิเศษ', createdAt: '2024-03-01' },
  { id: '2', type: 'news', title: 'โปรโมชั่นทัวร์เชียงใหม่', body: 'ลดราคาทัวร์เชียงใหม่ 3 วัน สำหรับลูกค้าใหม่', createdAt: '2024-02-15' },
];

const reviews: ContentItem[] = [
  { id: '1', type: 'review', title: 'รีวิวทัวร์เชียงใหม่', body: 'ทัวร์ดีมาก ไกด์พูดเพราะ อาหารอร่อย', author: 'สมชาย', createdAt: '2024-03-10' },
  { id: '2', type: 'review', title: 'รีวิวทัวร์ภูเก็ต', body: 'ทัวร์ภูเก็ตสนุกมาก หาดสวย โรงแรมดี', author: 'สมหญิง', createdAt: '2024-02-28' },
];

export default function HomePage() {
  return (
    <>
      <SEOHead title="หน้าแรก" description={SITE_DESCRIPTION} canonicalPath="/" />

      {/* Hero Banner */}
      <section className="bg-primary text-white py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h1 className="font-thai font-bold text-3xl md:text-5xl mb-4">{SITE_NAME}</h1>
          <p className="font-thai text-base md:text-lg mb-8">{SITE_DESCRIPTION}</p>
          <a href="/tours" className="btn-secondary inline-block">ดูทัวร์ทั้งหมด</a>
        </div>
      </section>

      {/* Featured Tours */}
      <section className="page-container">
        <h2 className="section-title">ทัวร์แนะนำ</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {featuredTours.map((tour) => (
            <TourCard key={tour.id} tour={tour} />
          ))}
        </div>
      </section>

      {/* News Highlights */}
      <section className="page-container">
        <h2 className="section-title">ข่าวล่าสุด</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {newsItems.map((item) => (
            <a href={`/news#${item.id}`} key={item.id} className="card-flat-hover block">
              <h3 className="font-thai font-bold text-base text-neutral-800 mb-1">{item.title}</h3>
              <p className="font-thai text-sm text-neutral-500">{item.body}</p>
            </a>
          ))}
        </div>
      </section>

      {/* Review Snippets */}
      <section className="page-container">
        <h2 className="section-title">รีวิวลูกค้า</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {reviews.map((item) => (
            <div key={item.id} className="card-flat">
              <h3 className="font-thai font-bold text-base text-neutral-800 mb-1">{item.title}</h3>
              <p className="font-thai text-sm text-neutral-500 mb-1">{item.body}</p>
              <span className="font-thai text-xs text-neutral-400">โดย {item.author}</span>
            </div>
          ))}
        </div>
        <a href="/reviews" className="btn-outline inline-block mt-4">ดูรีวิวทั้งหมด</a>
      </section>
    </>
  );
}
