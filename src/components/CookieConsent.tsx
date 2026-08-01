'use client';

import { useState, useEffect } from 'react';

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('pdpa_consent');
    if (!consent) {
      setVisible(true);
    }
  }, []);

  function accept() {
    localStorage.setItem('pdpa_consent', 'accepted');
    setVisible(false);
  }

  function reject() {
    localStorage.setItem('pdpa_consent', 'rejected');
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-neutral-800 text-white z-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <p className="font-thai text-sm">
          เว็บไซต์นี้ใช้คุกกี้เพื่อปรับปรุงการใช้งานและวิเคราะห์ข้อมูลการเข้าชม
          ตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล (PDPA) กรุณายอมรับหรือปฏิเสธการใช้คุกกี้
        </p>
        <div className="flex gap-3">
          <button onClick={accept} className="btn-primary text-sm">ยอมรับ</button>
          <button onClick={reject} className="btn-outline text-sm border-white text-white hover:bg-white hover:text-neutral-800">ปฏิเสธ</button>
        </div>
      </div>
    </div>
  );
}
