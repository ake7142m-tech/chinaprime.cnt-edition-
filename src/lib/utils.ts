import { SITE_URL } from '@/lib/constants';

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
}

export function formatPrice(price: number): string {
  return `฿${price.toLocaleString('th-TH')}`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\s]+/g, '-')
    .replace(/[^\w\-]/g, '');
}

export function buildCanonicalURL(path: string): string {
  return `${SITE_URL}${path}`;
}
