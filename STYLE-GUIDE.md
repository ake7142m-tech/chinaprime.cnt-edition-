# STYLE-GUIDE — ฟอนต์และมาตรฐาน TYPOGRAPHY (China Prime)

## ฟอนต์หลัก (ต้องปฏิบัติตาม)
- ฟอนต์หลัก: **Noto Sans Thai** — โหลดผ่าน next/font/google ใน `src/app/layout.tsx`
- โหลดเฉพาะน้ำหนักที่ใช้งาน: 300, 400, 500, 600, 700
- ใช้ตัวแปร CSS กลาง: `--font-sans` (ไม่อนุญาตประกาศ `font-family` ใหม่ต่อ component)

## กฎสำคัญ
- ห้ามประกาศ `font-family` ใหม่ในแต่ละ component ยกเว้นกรณีพิเศษที่ได้รับอนุญาต
- ถ้าต้องการฟอนต์อื่นสำหรับ Banner/Heading ให้ส่งคำขอให้ทีมออกแบบและเพิ่มเ��็นตัวเลือกอย่างเป็นทางการ (ไม่อนุญาตโหลดจาก component โดยตรง)
- คลาสช่วยเหลือ: ใช้ `.font-thai` หากต้องการแมปกับคลาสเดิม

## ขนาดและน้ำหนักแนะนำ
- เนื้อหา: 16px / line-height 1.6
- H1: 32–36px (700)
- H2: 24–28px (600)
- H3: 20px (600)

## การทดสอบ
- ทดสอบบน Windows, macOS, Android และ iOS
- ตรวจสอบ fallback เมื่อ next/font ไม่โหลด (ตรวจสอบ console/เครือข่าย)

## การใช้งานกับ Tailwind
- อยากให้ tailwind config แมป `fontFamily` ถาวรเป็น `var(--font-sans)` (optional) — ถ้าต้องการผมช่วยแก้ `tailwind.config.ts` ให้
