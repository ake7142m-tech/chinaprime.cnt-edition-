/**
 * PromptPay QR Code Generator
 * Implements Thai EMV QR Code specification (NITMX / PromptPay Spec v1.0.3)
 *
 * Format: EMV QRCPS Merchant-Presented Mode (MPM)
 *
 * Usage:
 *   const qr = generatePromptPayQR({ phone: '0812345678', amount: 5000 });
 *   // → raw string to pass to a QR rendering library (e.g. qrcode, react-qr-code)
 */

// ── CRC-16/CCITT-FALSE (poly 0x1021, init 0xFFFF) ──────────────
function crc16(data: string): string {
  let crc = 0xffff;
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

// ── TLV builder (Tag-Length-Value) ──────────────────────────────
function tlv(id: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${id}${len}${value}`;
}

// ── Merchant Account Information for PromptPay ───────────────────
// Tag 29 = PromptPay (Application Identifier 0016A000000677010111)
function buildMerchantAccount(target: string, targetType: 'phone' | 'nationalId' | 'taxId'): string {
  const guid = tlv('00', 'A000000677010111');

  let subTag: string;
  if (targetType === 'phone') {
    // Normalize: strip leading 0, prepend +66
    const normalized = '0066' + target.replace(/^0/, '').replace(/\D/g, '');
    subTag = tlv('01', normalized);
  } else if (targetType === 'nationalId') {
    subTag = tlv('02', target.replace(/\D/g, ''));
  } else {
    subTag = tlv('03', target.replace(/\D/g, ''));
  }

  return tlv('29', guid + subTag);
}

// ── Public API ───────────────────────────────────────────────────

export type PromptPayTarget =
  | { phone: string; amount?: number }
  | { nationalId: string; amount?: number }
  | { taxId: string; amount?: number };

export interface PromptPayQROptions {
  /** Mobile phone number, e.g. "0812345678" */
  phone?: string;
  /** 13-digit national ID */
  nationalId?: string;
  /** 13-digit tax ID (for business) */
  taxId?: string;
  /** Amount in THB (e.g. 5000 = ฿5,000). Omit for open-amount QR. */
  amountTHB?: number;
}

/**
 * Generate a PromptPay EMV QR payload string.
 * Pass this string to any QR code renderer.
 *
 * @throws Error if no target identifier is provided
 */
export function generatePromptPayQR(opts: PromptPayQROptions): string {
  const { phone, nationalId, taxId, amountTHB } = opts;

  if (!phone && !nationalId && !taxId) {
    throw new Error('PromptPay: must provide phone, nationalId, or taxId');
  }

  // 00 — Payload Format Indicator
  const pfi = tlv('00', '01');

  // 01 — Point of Initiation Method
  // 11 = Static (reusable), 12 = Dynamic (one-time, with amount)
  const poi = tlv('01', amountTHB !== undefined ? '12' : '11');

  // 29 — Merchant Account Information (PromptPay)
  let merchantAccount: string;
  if (phone) {
    merchantAccount = buildMerchantAccount(phone, 'phone');
  } else if (nationalId) {
    merchantAccount = buildMerchantAccount(nationalId, 'nationalId');
  } else {
    merchantAccount = buildMerchantAccount(taxId!, 'taxId');
  }

  // 53 — Transaction Currency (764 = THB)
  const currency = tlv('53', '764');

  // 54 — Transaction Amount (optional)
  const amountStr =
    amountTHB !== undefined
      ? tlv('54', amountTHB.toFixed(2))
      : '';

  // 58 — Country Code
  const country = tlv('58', 'TH');

  // 59 — Merchant Name (max 25 chars)
  const merchantName = tlv('59', 'CHINA PRIME');

  // 60 — Merchant City
  const merchantCity = tlv('60', 'BANGKOK');

  // 63 — CRC (placeholder — value computed over full string up to "6304")
  const partial =
    pfi + poi + merchantAccount + currency + amountStr +
    country + merchantName + merchantCity + '6304';

  const checksum = crc16(partial);
  const crcField = tlv('63', checksum);

  return (
    pfi + poi + merchantAccount + currency + amountStr +
    country + merchantName + merchantCity + crcField
  );
}

/** Convert THB satang (integer) → THB decimal (e.g. 500000 → 5000.00) */
export function satangToTHB(satang: number): number {
  return satang / 100;
}

/** Convert THB decimal → satang (e.g. 5000 → 500000) */
export function thbToSatang(thb: number): number {
  return Math.round(thb * 100);
}

/** Format THB amount as display string, e.g. 5000 → "5,000.00" */
export function formatTHB(thb: number): string {
  return thb.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
