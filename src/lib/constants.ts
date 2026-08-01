export const KV_NAMES = {
  TOURS: 'TOURS',
  USERS: 'USERS',
  BOOKINGS: 'BOOKINGS',
  CONTENT: 'CONTENT',
  STATS: 'STATS',
  CHAT_SESSIONS: 'CHAT_SESSIONS',
};

export const NAV_ITEMS = [
  { label: 'หน้าแรก', href: '/' },
  { label: 'ทัวร์', href: '/tours' },
  { label: 'ข่าว', href: '/news' },
  { label: 'รีวิว', href: '/reviews' },
  { label: 'ติดต่อ', href: '/contact' },
];

export const SITE_NAME = 'ทัวร์ไทยแลนด์';
export const SITE_DESCRIPTION = 'บริษัททัวร์ท่องเที่ยวในประเทศไทย จัดทัวร์ทุกภาค ราคาดี บริการครบ';
export const SITE_URL = 'https://tourthailand.com';

export interface Tour {
  id: string;
  title: string;
  slug: string;
  description: string;
  itinerary: string[];
  price: number;
  duration: string;
  category: string;
  region: string;
  image: string;
  seatsAvailable: number;
  schedules: Schedule[];
  seoTitle?: string;
  seoDescription?: string;
  seoUrl?: string;
  shareImage?: string;
}

export interface Schedule {
  date: string;
  seatsAvailable: number;
  price: number;
}

export interface Booking {
  id: string;
  tourId: string;
  userId: string;
  scheduleDate: string;
  travelerCount: number;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  paymentProof?: string;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  createdAt: string;
}

export interface ContentItem {
  id: string;
  type: 'news' | 'article' | 'review' | 'banner';
  title: string;
  body: string;
  image?: string;
  author?: string;
  createdAt: string;
  seoTitle?: string;
  seoDescription?: string;
  seoUrl?: string;
  shareImage?: string;
}

export interface StatsRecord {
  date: string;
  pageViews: Record<string, number>;
  referrers: Record<string, number>;
  buttonClicks: Record<string, number>;
}
