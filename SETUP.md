# คู่มือติดตั้ง — ระบบชำระเงิน, ตัดสต็อกที่นั่ง และ SMS

ไฟล์ทั้งหมดในโฟลเดอร์นี้เป็นไฟล์ **ใหม่เพิ่มเติม** เท่านั้น
**ไม่มีการแก้ไขไฟล์เดิมใดๆ**

---

## โครงสร้างไฟล์ใหม่

```
supabase/migrations/
  20260801000100_payment_sms_seats.sql   ← รัน 1 ครั้ง

app/lib/
  promptpay.ts          ← สร้าง PromptPay EMV QR
  payment-gateway.ts    ← Omise API (บัตรเครดิต + PromptPay)
  sms-provider.ts       ← ส่ง SMS (Telnyx / Twilio)
  booking-store.ts      ← CRUD bookings / payments / seats

app/api/
  bookings/route.ts           ← POST สร้างการจอง + hold seats
  bookings/[id]/route.ts      ← GET สถานะการจอง (polling)
  payments/promptpay/route.ts ← POST สร้าง PromptPay QR
  payments/card/route.ts      ← POST ตัดบัตรเครดิต
  payments/webhook/route.ts   ← POST รับ webhook จาก Omise
  seats/route.ts              ← GET ที่นั่งว่าง real-time
  seats/sync/route.ts         ← POST sync จากสายการบิน/operator
  sms/route.ts                ← POST ส่ง SMS, GET cron

app/book/[slug]/
  page.tsx              ← หน้าจองทัวร์ (server component)
  booking-client.tsx    ← UI จองและชำระเงิน (client)

app/components/booking/
  promptpay-panel.tsx   ← แสดง QR + นับเวลา + polling
  card-payment-form.tsx ← ฟอร์มบัตรเครดิต (Omise.js)
  seat-badge.tsx        ← badge ที่นั่งว่าง + progress bar

vercel.json             ← Cron jobs (SMS + seat sync)
.env.new-features.example
```

---

## 1. รัน Database Migration

```bash
# ใน Supabase Dashboard → SQL Editor
# หรือผ่าน CLI:
supabase db push
```

คัดลอกเนื้อหาจาก `supabase/migrations/20260801000100_payment_sms_seats.sql`
แล้ว run ใน SQL Editor ของ Supabase

---

## 2. ติดตั้ง Dependencies

ไม่จำเป็นต้องติดตั้ง package เพิ่มเติม (ใช้ fetch API ล้วน)

**Optional** — QR Code renderer (แนะนำ):
```bash
npm install qrcode
npm install --save-dev @types/qrcode
```

แล้วแทนที่ `<img src="https://api.qrserver.com/...">` ใน `promptpay-panel.tsx`:
```typescript
import QRCode from 'qrcode';
const qrDataUrl = await QRCode.toDataURL(qrData.qrData, { width: 220 });
// <img src={qrDataUrl} ... />
```

---

## 3. ตั้งค่า Environment Variables

คัดลอกจาก `.env.new-features.example` ใส่ใน `.env.local`:

### ระบบชำระเงิน (Omise)
1. สมัครที่ https://www.omise.co/
2. ไปที่ Dashboard → Settings → Keys
3. คัดลอก Secret Key และ Public Key
4. ตั้ง Webhook: Dashboard → Webhooks → `https://your-domain.com/api/payments/webhook`
5. ระบุ `PROMPTPAY_PHONE` เป็นเบอร์ PromptPay ของบริษัท

### ระบบ SMS
- **Dev**: `SMS_PROVIDER=log` (แสดงใน console)
- **Production** (แนะนำ Telnyx):
  1. สมัคร https://telnyx.com/
  2. ซื้อเบอร์ไทย หรือขอ Sender ID "CHINAPRIME"
  3. ตั้งค่า `TELNYX_API_KEY` และ `SMS_FROM_NUMBER`

### ระบบสต็อกที่นั่ง
- **ไม่มี API สายการบิน**: `SEAT_PROVIDER=none` → จัดการเองในฐานข้อมูล
- **มี API**: ตั้ง `SEAT_PROVIDER=tour_operator` และใส่ `SEAT_PROVIDER_API_URL`

---

## 4. เชื่อมลิงก์จองกับหน้าทัวร์เดิม

เพิ่มปุ่ม "จองเลย" ในหน้า `/app/join-tours/[slug]/page.tsx` ที่มีอยู่แล้ว
โดย **ไม่แก้ไขโค้ดเดิม** — เพียงเพิ่ม link ที่ชี้ไปยังหน้าใหม่:

```tsx
// ตัวอย่าง: ในไฟล์หน้าทัวร์เดิม ปุ่มจองสามารถลิงก์ไปที่:
<Link href={`/book/${tour.slug}`}>
  จองเลย
</Link>
```

URL pattern: `/book/[tourSlug]` → `app/book/[slug]/page.tsx`

---

## 5. Cron Jobs (Vercel)

คัดลอก `vercel.json` ไปวางที่ root ของโปรเจกต์ (ถ้ายังไม่มี)
ถ้ามี `vercel.json` อยู่แล้ว ให้เพิ่มเฉพาะ `"crons": [...]` section

| Schedule | Endpoint | หน้าที่ |
|---|---|---|
| ทุก 15 นาที | `/api/sms?action=process` | ส่ง SMS ที่ค้างในคิว |
| 09:00 น. (ทุกวัน) | `/api/sms?action=reminders` | queue SMS แจ้งเตือน 3 วันก่อนเดินทาง |
| ทุก 2 ชั่วโมง | `/api/seats/sync` | sync ที่นั่งจากสายการบิน |

---

## 6. Flow การทำงาน

```
ลูกค้า → /book/[slug]
  ↓
กรอกข้อมูล + เลือกวันเดินทาง
  ↓
POST /api/bookings → hold seats (DB lock) + สร้าง booking
  ↓
เลือก PromptPay หรือบัตรเครดิต
  ↓
PromptPay:                    บัตรเครดิต:
POST /api/payments/promptpay  POST /api/payments/card
→ สร้าง Omise PromptPay       → tokenize ผ่าน Omise.js
  source + charge             → charge API
→ แสดง QR (30 นาที)          → redirect 3DS (ถ้าจำเป็น)
→ poll /api/bookings/[id]
         ↓
    Omise Webhook → POST /api/payments/webhook
         ↓
  confirm_seats() + update booking 'confirmed'
         ↓
  ส่ง SMS ยืนยัน ทันที
         ↓
  Cron 09:00 (D-3) → ส่ง SMS แจ้งเตือน
```

---

## 7. เพิ่มข้อมูลสต็อกที่นั่งใน Supabase

```sql
-- เพิ่มสต็อกสำหรับทัวร์และวันเดินทางใหม่:
INSERT INTO seat_inventory (tour_slug, departure_date, total_seats)
VALUES
  ('beijing-classic-6d', '2026-09-15', 20),
  ('beijing-classic-6d', '2026-10-10', 18),
  ('shanghai-5d',        '2026-09-20', 16);

-- หรือ upsert จาก admin:
-- POST /api/seats/sync (ด้วย Bearer token)
```

---

## หมายเหตุ

- **PromptPay EMV QR** ถูก generate ฝั่ง server ด้วยโค้ด TypeScript ล้วน ไม่ต้องใช้ API ภายนอก
- **Omise** เป็น optional — ถ้าไม่ตั้งค่า `OMISE_SECRET_KEY`, PromptPay จะแสดง QR แบบ local (ใช้ได้กับทุกธนาคารไทย) แต่ไม่มี webhook อัตโนมัติ
- **SMS** ตอน dev ใช้ `SMS_PROVIDER=log` แสดงใน terminal แทนการส่งจริง
- ไฟล์ทั้งหมดเป็น TypeScript strict — ตรวจสอบ tsconfig ว่า `"strict": true`
