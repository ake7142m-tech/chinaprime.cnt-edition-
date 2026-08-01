import SEOHead from '@/components/SEOHead';
import TourCard from '@/components/TourCard';
import Breadcrumb from '@/components/Breadcrumb';
import type { Tour } from '@/lib/constants';

const allTours: Tour[] = [
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
  {
    id: '4', title: 'ทัวร์อยุธยา 1 วัน', slug: 'ayutthaya-1d',
    description: 'ทัวร์อยุธยา 1 วัน ชมวัดไชยวัฒนา เรือล่องแม่น้ำ',
    itinerary: ['วัดไชยวัฒนา', 'เรือล่องแม่น้ำ'],
    price: 950, duration: '1 วัน', category: 'ภาคกลาง', region: 'อยุธยา',
    image: '', seatsAvailable: 25, schedules: [],
  },
  {
    id: '5', title: 'ทัวร์เกาะสมุย 3 วัน', slug: 'kohsamui-3d',
    description: 'ทัวร์เกาะสมุย 3 วัน ชมหาดเฉวง เกาะตะน้อง น้ำตกนาเมือง',
    itinerary: ['หาดเฉวง', 'เกาะตะน้อง', 'น้ำตกนาเมือง'],
    price: 4200, duration: '3 วัน', category: 'ภาคใต้', region: 'สมุย',
    image: '', seatsAvailable: 12, schedules: [],
  },
];

const categories = ['ทั้งหมด', 'ภาคเหนือ', 'ภาคกลาง', 'ภาคใต้', 'ภาคอีสาน', 'ภาคตะวันออก'];

export default function ToursPage() {
  return (
    <>
      <SEOHead title="ทัวร์ทั้งหมด" description="รวมทัวร์ท่องเที่ยวทุกภาคของประเทศไทย" canonicalPath="/tours" />

      <div className="page-container">
        <Breadcrumb items={[
          { label: 'หน้าแรก', href: '/' },
          { label: 'ทัวร์' },
        ]} />

        <h1 className="section-title">ทัวร์ทั้งหมด</h1>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map((cat) => (
            <button key={cat} className="btn-outline text-sm">{cat}</button>
          ))}
        </div>

        <div className="flex items-center gap-4 mb-6">
          <label className="label-flat">ราคาสูงสุด</label>
          <input type="number" placeholder="0" className="input-flat w-32" />
        </div>

        {/* Tour Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {allTours.map((tour) => (
            <TourCard key={tour.id} tour={tour} />
          ))}
        </div>
      </div>
    </>
  );
}
