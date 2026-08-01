import SEOHead from '@/components/SEOHead';
import Breadcrumb from '@/components/Breadcrumb';
import type { ContentItem } from '@/lib/constants';

const reviews: ContentItem[] = [
  { id: '1', type: 'review', title: 'รีวิวทัวร์เชียงใหม่', body: 'ทัวร์ดีมาก ไกด์พูดเพราะ อาหารอร่อย โรงแรมสะอาด ประทับใจมาก', author: 'สมชาย', createdAt: '2024-03-10' },
  { id: '2', type: 'review', title: 'รีวิวทัวร์ภูเก็ต', body: 'ทัวร์ภูเก็ตสนุกมาก หาดสวย โรงแรมดี อาหารทะเลอร่อย', author: 'สมหญิง', createdAt: '2024-02-28' },
  { id: '3', type: 'review', title: 'รีวิวทัวร์อยุธยา', body: 'ทัวร์อยุธยาสวยงาม เหมาะสำหรับครอบครัว ไกด์มีความรู้ดี', author: 'วิชัย', createdAt: '2024-01-25' },
  { id: '4', type: 'review', title: 'รีวิวทัวร์เกาะสมุย', body: 'เกาะสมุยสวยมาก หาดเฉวงเย็นสบาย ทัวร์จัดดี', author: 'พิมพ์', createdAt: '2024-01-15' },
];

export default function ReviewsPage() {
  return (
    <>
      <SEOHead title="รีวิวลูกค้า" description="รีวิวทัวร์จากลูกค้าจริง" canonicalPath="/reviews" />

      <div className="page-container">
        <Breadcrumb items={[
          { label: 'หน้าแรก', href: '/' },
          { label: 'รีวิว' },
        ]} />

        <h1 className="section-title">รีวิวลูกค้า</h1>

        <div className="grid sm:grid-cols-2 gap-4">
          {reviews.map((item) => (
            <div key={item.id} className="card-flat">
              <div className="img-placeholder aspect-[3/1] rounded mb-3 overflow-hidden">
                {item.image ? (
                  <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                ) : (
                  <span className="font-thai text-sm">รีวิว</span>
                )}
              </div>
              <h3 className="font-thai font-bold text-base text-neutral-800 mb-1">{item.title}</h3>
              <p className="font-thai text-sm text-neutral-500 mb-2">{item.body}</p>
              <div className="flex justify-between">
                <span className="font-thai text-xs text-neutral-400">โดย {item.author}</span>
                <span className="font-thai text-xs text-neutral-400">{item.createdAt}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
