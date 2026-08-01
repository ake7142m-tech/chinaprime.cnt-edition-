import { formatPrice } from '@/lib/utils';
import type { Tour } from '@/lib/constants';

interface TourCardProps {
  tour: Tour;
}

export default function TourCard({ tour }: TourCardProps) {
  return (
    <a href={`/tours/${tour.slug}`} className="card-flat-hover block">
      <div className="img-placeholder aspect-[3/2] rounded mb-3 overflow-hidden">
        {tour.image ? (
          <img src={tour.image} alt={tour.title} className="w-full h-full object-cover" />
        ) : (
          <span className="font-thai">{tour.title}</span>
        )}
      </div>
      <h3 className="font-thai font-bold text-base text-neutral-800 mb-1">{tour.title}</h3>
      <p className="font-thai text-sm text-neutral-500 mb-2">{tour.duration} | {tour.region}</p>
      <div className="flex items-center justify-between">
        <span className="font-thai font-bold text-primary">{formatPrice(tour.price)}</span>
        <span className="font-thai text-xs text-neutral-400">
          {tour.seatsAvailable > 0 ? `เหลือ ${tour.seatsAvailable} ที่นั่ง` : 'เต็ม'}
        </span>
      </div>
    </a>
  );
}
