/**
 * SeatBadge — real-time seat availability indicator.
 *
 * Usage:
 *   <SeatBadge availableSeats={5} />
 *   <SeatBadge availableSeats={2} size="lg" />
 */

interface Props {
  availableSeats: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

type Level = 'open' | 'limited' | 'critical' | 'sold_out';

function getLevel(seats: number): Level {
  if (seats === 0) return 'sold_out';
  if (seats <= 3) return 'critical';
  if (seats <= 7) return 'limited';
  return 'open';
}

const styles: Record<Level, { bg: string; text: string; dot: string; label: string }> = {
  open:     { bg: 'bg-[#DCFCE7]', text: 'text-[#166534]', dot: 'bg-[#16A34A]', label: 'ว่าง' },
  limited:  { bg: 'bg-[#FEF3C7]', text: 'text-[#92400E]', dot: 'bg-[#F59E0B]', label: 'ใกล้เต็ม' },
  critical: { bg: 'bg-[#FEE2E2]', text: 'text-[#991B1B]', dot: 'bg-[#DC2626]', label: 'เหลือน้อย' },
  sold_out: { bg: 'bg-[#F1F5F9]', text: 'text-[#94A3B8]', dot: 'bg-[#CBD5E1]', label: 'เต็ม' },
};

const sizeCls = {
  sm: 'px-2 py-0.5 text-[11px] gap-1',
  md: 'px-2.5 py-1 text-xs gap-1.5',
  lg: 'px-3 py-1.5 text-sm gap-2',
};

const dotSize = { sm: 'h-1.5 w-1.5', md: 'h-2 w-2', lg: 'h-2.5 w-2.5' };

export function SeatBadge({ availableSeats, size = 'md', showLabel = true }: Props) {
  const level = getLevel(availableSeats);
  const s = styles[level];

  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold ${s.bg} ${s.text} ${sizeCls[size]}`}
      aria-label={`ที่นั่งว่าง ${availableSeats} ที่`}
    >
      <span className={`rounded-full ${s.dot} ${dotSize[size]} flex-shrink-0`} />
      {level === 'sold_out' ? (
        'เต็ม'
      ) : (
        <>
          เหลือ {availableSeats} ที่
          {showLabel && level !== 'open' && ` — ${s.label}`}
        </>
      )}
    </span>
  );
}

/** Standalone seat counter strip — used in tour detail pages */
export function SeatCounterStrip({
  availableSeats,
  totalSeats,
}: {
  availableSeats: number;
  totalSeats: number;
}) {
  const level = getLevel(availableSeats);
  const s = styles[level];
  const pct = Math.round(((totalSeats - availableSeats) / totalSeats) * 100);

  return (
    <div className={`rounded-xl p-3.5 ${s.bg}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${s.dot} ${level !== 'sold_out' ? 'animate-pulse' : ''}`} />
          <span className={`text-sm font-semibold ${s.text}`}>
            {level === 'sold_out'
              ? 'ที่นั่งเต็ม'
              : `เหลือ ${availableSeats} จาก ${totalSeats} ที่`}
          </span>
        </div>
        <span className={`text-xs font-medium ${s.text}`}>{s.label}</span>
      </div>

      {/* Progress bar */}
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/50">
        <div
          className={`h-full rounded-full transition-all duration-500 ${s.dot}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
