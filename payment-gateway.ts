/**
 * Payment Gateway Integration — Omise (Thailand)
 *
 * Omise is the most common Thai payment gateway, supporting:
 *  - Credit/Debit cards (Visa, Mastercard, JCB)
 *  - PromptPay (via "source" of type "promptpay")
 *  - Internet Banking, TrueMoney, etc.
 *
 * Environment variables required:
 *  OMISE_SECRET_KEY   — server-side secret key (sk_...)
 *  OMISE_PUBLIC_KEY   — client-side public key (pkey_...)
 *  NEXT_PUBLIC_OMISE_PUBLIC_KEY — same public key, exposed to browser
 *
 * Docs: https://docs.opn.ooo/
 */

const OMISE_API_BASE = 'https://api.omise.co';

function getOmiseSecretKey(): string {
  const key = process.env.OMISE_SECRET_KEY;
  if (!key) throw new Error('OMISE_SECRET_KEY is not set');
  return key;
}

function omiseAuthHeader(): HeadersInit {
  return {
    Authorization: 'Basic ' + Buffer.from(getOmiseSecretKey() + ':').toString('base64'),
    'Content-Type': 'application/json',
  };
}

async function omiseFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${OMISE_API_BASE}${path}`, {
    ...options,
    headers: {
      ...omiseAuthHeader(),
      ...(options?.headers ?? {}),
    },
  });

  const json = (await res.json()) as T & { object?: string; code?: string; message?: string };

  if (!res.ok) {
    const err = json as { code?: string; message?: string };
    throw new GatewayError(
      err.message ?? `Omise API error ${res.status}`,
      err.code ?? 'unknown',
      res.status,
    );
  }

  return json;
}

// ── Error class ────────────────────────────────────────────────────
export class GatewayError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = 'GatewayError';
  }
}

// ── Types ──────────────────────────────────────────────────────────
export interface OmiseCharge {
  object: 'charge';
  id: string;
  status: 'pending' | 'successful' | 'failed' | 'reversed' | 'expired';
  amount: number;         // satang
  currency: string;
  paid: boolean;
  failure_code?: string;
  failure_message?: string;
  card?: {
    last_digits: string;
    brand: string;
    name: string;
    expiration_month: number;
    expiration_year: number;
  };
  source?: {
    id: string;
    type: string;
    scannable_code?: {
      type: string;
      image: { download_uri: string };
    };
  };
  authorize_uri?: string;
  return_uri?: string;
  expires_at?: string;
}

export interface OmiseSource {
  object: 'source';
  id: string;
  type: string;
  amount: number;
  currency: string;
  scannable_code?: {
    type: string;
    image: { download_uri: string };
  };
  expires_at?: string;
}

// ── Create PromptPay Source ────────────────────────────────────────
export async function createPromptPaySource(amountSatang: number): Promise<OmiseSource> {
  return omiseFetch<OmiseSource>('/sources', {
    method: 'POST',
    body: JSON.stringify({
      type: 'promptpay',
      amount: amountSatang,
      currency: 'THB',
    }),
  });
}

// ── Create Charge (token from Omise.js on client) ─────────────────
export interface CreateChargeParams {
  amountSatang: number;
  description: string;
  /** Omise card token (from Omise.js createToken) — for card payments */
  cardToken?: string;
  /** Omise PromptPay source ID (from createPromptPaySource) */
  sourceId?: string;
  /** URL to redirect to after 3DS challenge */
  returnUri?: string;
  metadata?: Record<string, string | number>;
}

export async function createCharge(params: CreateChargeParams): Promise<OmiseCharge> {
  const body: Record<string, unknown> = {
    amount: params.amountSatang,
    currency: 'THB',
    description: params.description,
    metadata: params.metadata ?? {},
  };

  if (params.cardToken) {
    body.card = params.cardToken;
    body.return_uri = params.returnUri;
    body.capture = true;
  } else if (params.sourceId) {
    body.source = params.sourceId;
    body.return_uri = params.returnUri;
  } else {
    throw new GatewayError('Either cardToken or sourceId must be provided', 'invalid_params', 400);
  }

  return omiseFetch<OmiseCharge>('/charges', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

// ── Retrieve Charge ────────────────────────────────────────────────
export async function getCharge(chargeId: string): Promise<OmiseCharge> {
  return omiseFetch<OmiseCharge>(`/charges/${chargeId}`);
}

// ── Verify Webhook Signature ───────────────────────────────────────
import { createHmac } from 'crypto';

export function verifyOmiseWebhook(rawBody: string, signature: string): boolean {
  const webhookSecret = process.env.OMISE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.warn('[payment-gateway] OMISE_WEBHOOK_SECRET not set — skipping verification');
    return true; // allow in dev; enforce in prod
  }
  const expected = createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex');
  return expected === signature;
}

// ── Map Omise status → internal status ────────────────────────────
export type PaymentStatus = 'pending' | 'processing' | 'succeeded' | 'failed' | 'refunded';

export function mapOmiseStatus(charge: OmiseCharge): PaymentStatus {
  if (charge.status === 'successful' && charge.paid) return 'succeeded';
  if (charge.status === 'failed' || charge.status === 'reversed') return 'failed';
  if (charge.status === 'expired') return 'failed';
  return 'pending';
}

// ── Deposit calculation ────────────────────────────────────────────
/** Standard deposit: 30% of total, minimum ฿3,000, rounded to nearest ฿500 */
export function calculateDeposit(totalTHB: number): number {
  const raw = totalTHB * 0.3;
  const floored = Math.max(3000, raw);
  return Math.ceil(floored / 500) * 500;
}
