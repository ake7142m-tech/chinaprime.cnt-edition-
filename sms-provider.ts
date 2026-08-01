/**
 * SMS Notification Provider
 *
 * Supports two providers via the SMS_PROVIDER env var:
 *   - "telnyx"  — Telnyx (recommended; supports Thai numbers, good delivery rates)
 *   - "twilio"  — Twilio (fallback / international)
 *
 * Required env vars (Telnyx):
 *   SMS_PROVIDER=telnyx
 *   TELNYX_API_KEY=KEY0...
 *   TELNYX_MESSAGING_PROFILE_ID=...
 *   SMS_FROM_NUMBER=+66XXXXXXXXX  (Thai long number) or Sender ID string
 *
 * Required env vars (Twilio):
 *   SMS_PROVIDER=twilio
 *   TWILIO_ACCOUNT_SID=ACxxxx
 *   TWILIO_AUTH_TOKEN=xxxx
 *   SMS_FROM_NUMBER=+66XXXXXXXXX
 *
 * In development (SMS_PROVIDER=log), messages are written to console only.
 */

export type SmsProvider = 'telnyx' | 'twilio' | 'log';

export interface SmsSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// ── Telnyx ────────────────────────────────────────────────────────
async function sendViaTelnyx(to: string, body: string): Promise<SmsSendResult> {
  const apiKey = process.env.TELNYX_API_KEY;
  const profileId = process.env.TELNYX_MESSAGING_PROFILE_ID;
  const from = process.env.SMS_FROM_NUMBER ?? 'CHINAPRIME';

  if (!apiKey) throw new Error('TELNYX_API_KEY is not set');

  const res = await fetch('https://api.telnyx.com/v2/messages', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: normalizeThaiPhone(to),
      text: body,
      ...(profileId ? { messaging_profile_id: profileId } : {}),
      type: 'SMS',
    }),
  });

  if (!res.ok) {
    const err = (await res.json()) as { errors?: { detail: string }[] };
    const detail = err.errors?.[0]?.detail ?? `HTTP ${res.status}`;
    return { success: false, error: `Telnyx: ${detail}` };
  }

  const data = (await res.json()) as { data: { id: string } };
  return { success: true, messageId: data.data.id };
}

// ── Twilio ────────────────────────────────────────────────────────
async function sendViaTwilio(to: string, body: string): Promise<SmsSendResult> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.SMS_FROM_NUMBER;

  if (!sid || !token || !from) {
    throw new Error('Twilio env vars (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, SMS_FROM_NUMBER) not set');
  }

  const params = new URLSearchParams({
    To: normalizeThaiPhone(to),
    From: from,
    Body: body,
  });

  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    },
  );

  if (!res.ok) {
    const err = (await res.json()) as { message: string };
    return { success: false, error: `Twilio: ${err.message}` };
  }

  const data = (await res.json()) as { sid: string };
  return { success: true, messageId: data.sid };
}

// ── Dev logger ────────────────────────────────────────────────────
async function sendViaLog(to: string, body: string): Promise<SmsSendResult> {
  const msgId = 'LOG-' + Date.now();
  console.log(
    `\n📱 [SMS-LOG] To: ${to}\n${'─'.repeat(50)}\n${body}\n${'─'.repeat(50)}\nID: ${msgId}\n`,
  );
  return { success: true, messageId: msgId };
}

// ── Main send function ────────────────────────────────────────────
export async function sendSms(to: string, body: string): Promise<SmsSendResult> {
  const provider = (process.env.SMS_PROVIDER as SmsProvider | undefined) ?? 'log';

  try {
    switch (provider) {
      case 'telnyx': return await sendViaTelnyx(to, body);
      case 'twilio': return await sendViaTwilio(to, body);
      default:       return await sendViaLog(to, body);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[sms-provider] Error:', message);
    return { success: false, error: message };
  }
}

// ── Phone normalization ───────────────────────────────────────────
/** Convert Thai phone "0812345678" → "+66812345678" */
export function normalizeThaiPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('66')) return `+${digits}`;
  if (digits.startsWith('0')) return `+66${digits.slice(1)}`;
  if (digits.startsWith('+')) return phone;
  return `+66${digits}`;
}

// ── SMS Templates ─────────────────────────────────────────────────
export interface BookingInfo {
  bookingRef: string;
  tourTitle: string;
  departureDate: string;   // human-readable, e.g. "15 ส.ค. 69"
  passengerCount: number;
  depositTHB: number;
  totalTHB: number;
  lineUrl?: string;
}

/** SMS sent immediately after deposit payment succeeds */
export function buildConfirmationSms(info: BookingInfo): string {
  return (
    `✅ ยืนยันการจอง CHINA PRIME\n` +
    `รหัส: ${info.bookingRef}\n` +
    `ทัวร์: ${info.tourTitle}\n` +
    `ออกเดินทาง: ${info.departureDate}\n` +
    `จำนวน: ${info.passengerCount} ท่าน\n` +
    `มัดจำ: ฿${info.depositTHB.toLocaleString('th-TH')}\n` +
    `รวม: ฿${info.totalTHB.toLocaleString('th-TH')}\n` +
    `สอบถาม LINE: ${info.lineUrl ?? '@chinaprime'}`
  );
}

/** SMS sent 3 days before departure */
export function buildReminderSms(info: BookingInfo): string {
  return (
    `🌏 CHINA PRIME — เตรียมตัวเดินทาง!\n` +
    `ทัวร์ ${info.tourTitle} ออกเดินทาง ${info.departureDate}\n` +
    `(อีก 3 วัน) รหัสจอง: ${info.bookingRef}\n` +
    `เอกสาร/คำถาม: LINE ${info.lineUrl ?? '@chinaprime'}`
  );
}

/** Custom text message */
export function buildCustomSms(leadName: string, body: string): string {
  return `[CHINA PRIME] คุณ${leadName} — ${body}`;
}
