import SEOHead from '@/components/SEOHead';
import Breadcrumb from '@/components/Breadcrumb';
import { formatPrice } from '@/lib/utils';
import { SITE_URL } from '@/lib/constants';
import type { Tour } from '@/lib/constants';

// Sample data - in production fetched from KV
const tour: Tour = {
  id: '1', title: 'ทัวร์เชียงใหม่ 3 วัน', slug: 'chiangmai-3d',
  description: 'ทัวร์เชียงใหม่ 3 วัน ชมดอยสุเทพ วัดพระสิงห์ ตลาดนัดเชียงใหม่ อาหารเหนืออร่อย โรงแรมดี',
  itinerary: ['วันที่ 1: ดอยสุเทพ - วัดพระสิงห์', 'วันที่ 2: ตลาดนัดเชียงใหม่ - อุ้งแม่น้ำ', 'วันที่ 3: บ้านกะเหรี่ยง - น้ำตก'],
  price: 3500, duration: '3 วัน', category: 'ภาคเหนือ', region: 'เชียงใหม่',
  image: '', seatsAvailable: 15,
  schedules: [
    { date: '2024-04-10', seatsAvailable: 15, price: 3500 },
    { date: '2024-04-20', seatsAvailable: 10, price: 3500 },
    { date: '2024-05-01', seatsAvailable: 20, price: 3200 },
  ],
  seoTitle: 'ทัวร์เชียงใหม่ 3 วัน - ทัวร์ไทยแลนด์',
  seoDescription: 'ทัวร์เชียงใหม่ 3 วัน ชมดอยสุเทพ วัดพระสิงห์ ตลาดนัด ราคาดี',
  seoUrl: 'chiangmai-3d',
  shareImage: '',
};

// Schema markup for TourProduct
const schemaMarkup = {
  '@context': 'https://schema.org',
  '@type': 'TourProduct',
  name: tour.title,
  description: tour.description,
  price: tour.price,
  priceCurrency: 'THB',
  duration: tour.duration,
  url: `${SITE_URL}/tours/${tour.slug}`,
  image: tour.shareImage || `${SITE_URL}/images/og-default.jpg`,
};

export default function TourDetailPage({ params }: { params: { slug: string } }) {
  return (
    <>
      <SEOHead
        title={tour.seoTitle || tour.title}
        description={tour.seoDescription || tour.description}
        canonicalPath={`/tours/${tour.slug}`}
        ogImage={tour.shareImage}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaMarkup) }}
      />

      <div className="page-container">
        <Breadcrumb items={[
          { label: 'หน้าแรก', href: '/' },
          { label: 'ทัวร์', href: '/tours' },
          { label: tour.title },
        ]} />

        {/* Tour Image */}
        <div className="img-placeholder aspect-[3/2] rounded mb-6 overflow-hidden">
          {tour.image ? (
            <img src={tour.image} alt={tour.title} className="w-full h-full object-cover" />
          ) : (
            <span className="font-thai text-lg">{tour.title}</span>
          )}
        </div>

        {/* Tour Info */}
        <h1 className="font-thai font-bold text-2xl md:text-3xl text-neutral-800 mb-2">{tour.title}</h1>
        <p className="font-thai text-sm text-neutral-500 mb-4">{tour.region} | {tour.duration}</p>
        <p className="font-thai text-base text-neutral-700 mb-6">{tour.description}</p>

        {/* Itinerary */}
        <section className="mb-8">
          <h2 className="font-thai font-bold text-lg text-neutral-800 mb-3">สถานที่/กิจกรรม</h2>
          <ul className="font-thai text-sm text-neutral-600 space-y-2">
            {tour.itinerary.map((item, i) => (
              <li key={i} className="border-b border-neutral-200 pb-2">{item}</li>
            ))}
          </ul>
        </section>

        {/* Price & Availability */}
        <section className="mb-8">
          <h2 className="font-thai font-bold text-lg text-neutral-800 mb-3">ราคาและที่นั่ง</h2>
          <div className="card-flat">
            <table className="w-full font-thai text-sm">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="py-2 text-left text-neutral-600">วันเดินทาง</th>
                  <th className="py-2 text-left text-neutral-600">ราคา</th>
                  <th className="py-2 text-left text-neutral-600">ที่นั่ง</th>
                </tr>
              </thead>
              <tbody>
                {tour.schedules.map((s, i) => (
                  <tr key={i} className="border-b border-neutral-100">
                    <td className="py-2">{s.date}</td>
                    <td className="py-2">{formatPrice(s.price)}</td>
                    <td className="py-2">{s.seatsAvailable > 0 ? `${s.seatsAvailable} ที่นั่ง` : 'เต็ม'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Booking Button */}
        <div className="flex gap-4 mb-8">
          <a href={`/tours/${tour.slug}/book`} className="btn-primary">จองทัวร์</a>
          <button
            onClick={() => { if (typeof window !== 'undefined' && (window as unknown as Record<string, unknown>).__trackClick) { ((window as unknown as Record<string, unknown>).__trackClick as Function)('booking', tour.title); } }}
            className="btn-outline"
          >
            สอบถามข้อมูล
          </button>
        </div>
      </div>
    </>
  );
}
