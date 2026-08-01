import SEOHead from '@/components/SEOHead';
import Breadcrumb from '@/components/Breadcrumb';
import type { ContentItem } from '@/lib/constants';

const newsItems: ContentItem[] = [
  { id: '1', type: 'news', title: 'เปิดทัวร์ใหม่ ภูเก็ต ฤดูร้อน', body: 'เปิดรับจองทัวร์ภูเก็ต 4 วัน ฤดูร้อน ราคาพิเศษ จองเร็วได้ส่วนลด', createdAt: '2024-03-01' },
  { id: '2', type: 'news', title: 'โปรโมชั่นทัวร์เชียงใหม่', body: 'ลดราคาทัวร์เชียงใหม่ 3 วัน สำหรับลูกค้าใหม่ จองวันนี้รับส่วนลดทันที', createdAt: '2024-02-15' },
  { id: '3', type: 'news', title: 'ทัวร์อยุธยาเปิดตัว', body: 'ทัวร์อยุธยา 1 วัน เหมาะสำหรับครอบครัว ราคาเริ่ม 950 บาท', createdAt: '2024-01-20' },
  { id: '4', type: 'article', title: 'เที่ยวเชียงใหม่ฤดูหนาว', body: 'เชียงใหม่ฤดูหนาวสวยงาม อากาศเย็นสบาย เหมาะแก่การพักผ่อน', createdAt: '2024-01-10' },
];

export default function NewsPage() {
  return (
    <>
      <SEOHead title="ข่าวและบทความ" description="ข่าวทัวร์ โปรโมชั่น บทความท่องเที่ยว" canonicalPath="/news" />

      <div className="page-container">
        <Breadcrumb items={[
          { label: 'หน้าแรก', href: '/' },
          { label: 'ข่าว' },
        ]} />

        <h1 className="section-title">ข่าวและบทความ</h1>

        <div className="space-y-4">
          {newsItems.map((item) => (
            <article key={item.id} id={item.id} className="card-flat-hover block">
              <div className="img-placeholder aspect-[3/1] rounded mb-3 overflow-hidden">
                {item.image ? (
                  <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                ) : (
                  <span className="font-thai text-sm">{item.type === 'news' ? 'ข่าว' : 'บทความ'}</span>
                )}
              </div>
              <h2 className="font-thai font-bold text-base text-neutral-800 mb-1">{item.title}</h2>
              <p className="font-thai text-sm text-neutral-500 mb-2">{item.body}</p>
              <span className="font-thai text-xs text-neutral-400">{item.createdAt}</span>
            </article>
          ))}
        </div>
      </div>
    </>
  );
}
