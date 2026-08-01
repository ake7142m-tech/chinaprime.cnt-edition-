'use client';

import { useState } from 'react';
import { NAV_ITEMS, SITE_NAME } from '@/lib/constants';

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const isLoggedIn = false; // TODO: check auth state

  return (
    <header className="bg-primary text-white sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <a href="/" className="font-thai font-bold text-xl">{SITE_NAME}</a>

        <nav className="hidden md:flex gap-6 font-thai text-sm">
          {NAV_ITEMS.map((item) => (
            <a key={item.href} href={item.href} className="hover:text-accent transition-colors duration-150">
              {item.label}
            </a>
          ))}
          <a href={isLoggedIn ? '/profile' : '/auth/login'} className="hover:text-accent transition-colors duration-150">
            {isLoggedIn ? 'โปรไฟล์' : 'เข้าสู่ระบบ'}
          </a>
        </nav>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden text-white p-2"
          aria-label="เปิดเมนู"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {menuOpen && (
        <nav className="md:hidden bg-primary-dark px-4 py-2 font-thai text-sm">
          {NAV_ITEMS.map((item) => (
            <a key={item.href} href={item.href} className="block py-2 hover:text-accent transition-colors duration-150">
              {item.label}
            </a>
          ))}
          <a href={isLoggedIn ? '/profile' : '/auth/login'} className="block py-2 hover:text-accent transition-colors duration-150">
            {isLoggedIn ? 'โปรไฟล์' : 'เข้าสู่ระบบ'}
          </a>
        </nav>
      )}
    </header>
  );
}
