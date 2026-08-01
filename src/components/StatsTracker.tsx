'use client';

export default function StatsTracker() {
  function trackClick(category: string, label: string) {
    try {
      fetch('/api/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'click', category, label }),
      }).catch(() => {});
    } catch {}
  }

  // Expose globally so buttons can call window.__trackClick
  if (typeof window !== 'undefined') {
    (window as unknown as Record<string, unknown>).__trackClick = trackClick;
  }

  return null;
}
