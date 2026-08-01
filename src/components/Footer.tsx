import { NAV_ITEMS, SITE_NAME } from '@/lib/constants';

export default function Footer() {
  return (
    <footer className="bg-neutral-800 text-neutral-300 mt-12">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-thai font-bold text-lg text-white mb-2">{SITE_NAME}</h3>
            <p className="font-thai text-sm">บริษัททัวร์ท่องเที่ยวในประเทศไทย</p>
            <p className="font-thai text-sm">จัดทัวร์ทุกภาค ราคาดี บริการครบ</p>
          </div>
          <div>
            <h3 className="font-thai font-bold text-lg text-white mb-2">เมนู</h3>
            <ul className="font-thai text-sm">
              {NAV_ITEMS.map((item) => (
                <li key={item.href}>
                  <a href={item.href} className="hover:text-accent transition-colors duration-150">{item.label}</a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-thai font-bold text-lg text-white mb-2">ติดต่อ</h3>
            <p className="font-thai text-sm">โทร: 02-123-4567</p>
            <p className="font-thai text-sm">อีเมล: info@tourthailand.com</p>
            <p className="font-thai text-sm">LINE: @tourthailand</p>
            <div className="flex gap-4 mt-3">
              <a href="https://facebook.com/tourthailand" className="hover:text-accent transition-colors duration-150" aria-label="Facebook">Facebook</a>
              <a href="https://line.me/ti/p/@tourthailand" className="hover:text-accent transition-colors duration-150" aria-label="LINE">LINE</a>
              <a href="https://instagram.com/tourthailand" className="hover:text-accent transition-colors duration-150" aria-label="Instagram">Instagram</a>
            </div>
          </div>
        </div>
        <div className="border-t border-neutral-700 mt-6 pt-4 font-thai text-xs text-neutral-400 text-center">
          {SITE_NAME} - สงวนลิขสิทธิ์
        </div>
      </div>
    </footer>
  );
}
