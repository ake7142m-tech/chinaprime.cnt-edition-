/**
 * Booking Store
 * Database operations for bookings, payments, seat inventory, and SMS queue.
 * All writes use the Supabase service-role client (bypasses RLS).
 */

import { getSupabaseAdminClient } from './supabase-server';

// ── Types ──────────────────────────────────────────────────────────

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'refunded';
export type PaymentMethod = 'promptpay' | 'credit_card';
export type PaymentStatus = 'pending' | 'processing' | 'succeeded' | 'failed' | 'refunded';

export interface Booking {
  id: string;
  bookingRef: string;
  tourSlug: string;
  tourTitle: string;
  departureDate: string;      // ISO date "YYYY-MM-DD"
  status: BookingStatus;
  leadName: string;
  leadPhone: string;
  leadEmail: string;
  passengerCount: number;
  specialRequests: string;
  pricePerPerson: number;     // satang
  depositAmount: number;      // satang
  totalAmount: number;        // satang
  customerUserId?: string;
  smsConfirmSent: boolean;
  smsReminderSent: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  bookingId: string;
  amount: number;             // satang
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  gateway: string;
  gatewayChargeId?: string;
  gatewaySourceId?: string;
  gatewayCardLast4?: string;
  gatewayCardBrand?: string;
  gatewayRawResponse?: object;
  promptpayQrData?: string;
  promptpayExpiresAt?: string;
  paidAt?: string;
  failedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SeatInventory {
  id: string;
  tourSlug: string;
  departureDate: string;
  totalSeats: number;
  heldSeats: number;
  soldSeats: number;
  availableSeats: number;     // computed: total - held - sold
  lastSyncedAt?: string;
  syncSource: string;
  externalRef?: string;
}

// ── DB row → domain model mappers ────────────────────────────────

function rowToBooking(row: Record<string, unknown>): Booking {
  return {
    id: row.id as string,
    bookingRef: row.booking_ref as string,
    tourSlug: row.tour_slug as string,
    tourTitle: row.tour_title as string,
    departureDate: row.departure_date as string,
    status: row.status as BookingStatus,
    leadName: row.lead_name as string,
    leadPhone: row.lead_phone as string,
    leadEmail: row.lead_email as string,
    passengerCount: row.passenger_count as number,
    specialRequests: row.special_requests as string,
    pricePerPerson: row.price_per_person as number,
    depositAmount: row.deposit_amount as number,
    totalAmount: row.total_amount as number,
    customerUserId: row.customer_user_id as string | undefined,
    smsConfirmSent: row.sms_confirm_sent as boolean,
    smsReminderSent: row.sms_reminder_sent as boolean,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function rowToPayment(row: Record<string, unknown>): Payment {
  return {
    id: row.id as string,
    bookingId: row.booking_id as string,
    amount: row.amount as number,
    currency: row.currency as string,
    method: row.method as PaymentMethod,
    status: row.status as PaymentStatus,
    gateway: row.gateway as string,
    gatewayChargeId: row.gateway_charge_id as string | undefined,
    gatewaySourceId: row.gateway_source_id as string | undefined,
    gatewayCardLast4: row.gateway_card_last4 as string | undefined,
    gatewayCardBrand: row.gateway_card_brand as string | undefined,
    gatewayRawResponse: row.gateway_raw_response as object | undefined,
    promptpayQrData: row.promptpay_qr_data as string | undefined,
    promptpayExpiresAt: row.promptpay_expires_at as string | undefined,
    paidAt: row.paid_at as string | undefined,
    failedAt: row.failed_at as string | undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function rowToSeat(row: Record<string, unknown>): SeatInventory {
  const total = row.total_seats as number;
  const held = row.held_seats as number;
  const sold = row.sold_seats as number;
  return {
    id: row.id as string,
    tourSlug: row.tour_slug as string,
    departureDate: row.departure_date as string,
    totalSeats: total,
    heldSeats: held,
    soldSeats: sold,
    availableSeats: Math.max(0, total - held - sold),
    lastSyncedAt: row.last_synced_at as string | undefined,
    syncSource: row.sync_source as string,
    externalRef: row.external_ref as string | undefined,
  };
}

// ── Booking CRUD ──────────────────────────────────────────────────

export interface CreateBookingInput {
  tourSlug: string;
  tourTitle: string;
  departureDate: string;
  leadName: string;
  leadPhone: string;
  leadEmail?: string;
  passengerCount: number;
  specialRequests?: string;
  pricePerPersonSatang: number;
  depositAmountSatang: number;
  totalAmountSatang: number;
  customerUserId?: string;
}

export async function createBooking(input: CreateBookingInput): Promise<Booking> {
  const sb = getSupabaseAdminClient();

  // Generate booking reference using the DB function
  const { data: refData } = await sb.rpc('generate_booking_ref');
  const bookingRef = (refData as string) ?? `CP-${Date.now()}`;

  const { data, error } = await sb
    .from('bookings')
    .insert({
      booking_ref: bookingRef,
      tour_slug: input.tourSlug,
      tour_title: input.tourTitle,
      departure_date: input.departureDate,
      status: 'pending',
      lead_name: input.leadName,
      lead_phone: input.leadPhone,
      lead_email: input.leadEmail ?? '',
      passenger_count: input.passengerCount,
      special_requests: input.specialRequests ?? '',
      price_per_person: input.pricePerPersonSatang,
      deposit_amount: input.depositAmountSatang,
      total_amount: input.totalAmountSatang,
      customer_user_id: input.customerUserId ?? null,
    })
    .select()
    .single();

  if (error) throw new Error(`createBooking: ${error.message}`);
  return rowToBooking(data as Record<string, unknown>);
}

export async function getBookingById(id: string): Promise<Booking | null> {
  const sb = getSupabaseAdminClient();
  const { data, error } = await sb
    .from('bookings')
    .select('*')
    .eq('id', id)
    .single();
  if (error) return null;
  return rowToBooking(data as Record<string, unknown>);
}

export async function getBookingByRef(ref: string): Promise<Booking | null> {
  const sb = getSupabaseAdminClient();
  const { data, error } = await sb
    .from('bookings')
    .select('*')
    .eq('booking_ref', ref)
    .single();
  if (error) return null;
  return rowToBooking(data as Record<string, unknown>);
}

export async function updateBookingStatus(id: string, status: BookingStatus): Promise<void> {
  const sb = getSupabaseAdminClient();
  const { error } = await sb
    .from('bookings')
    .update({ status })
    .eq('id', id);
  if (error) throw new Error(`updateBookingStatus: ${error.message}`);
}

export async function markBookingSmsSent(
  id: string,
  type: 'confirm' | 'reminder',
): Promise<void> {
  const sb = getSupabaseAdminClient();
  const field = type === 'confirm' ? 'sms_confirm_sent' : 'sms_reminder_sent';
  const { error } = await sb
    .from('bookings')
    .update({ [field]: true })
    .eq('id', id);
  if (error) throw new Error(`markBookingSmsSent: ${error.message}`);
}

// ── Payment CRUD ──────────────────────────────────────────────────

export interface CreatePaymentInput {
  bookingId: string;
  amountSatang: number;
  method: PaymentMethod;
  gateway?: string;
  gatewayChargeId?: string;
  gatewaySourceId?: string;
  promptpayQrData?: string;
  promptpayExpiresAt?: string;
}

export async function createPayment(input: CreatePaymentInput): Promise<Payment> {
  const sb = getSupabaseAdminClient();
  const { data, error } = await sb
    .from('payments')
    .insert({
      booking_id: input.bookingId,
      amount: input.amountSatang,
      currency: 'THB',
      method: input.method,
      status: 'pending',
      gateway: input.gateway ?? 'omise',
      gateway_charge_id: input.gatewayChargeId ?? null,
      gateway_source_id: input.gatewaySourceId ?? null,
      promptpay_qr_data: input.promptpayQrData ?? null,
      promptpay_expires_at: input.promptpayExpiresAt ?? null,
    })
    .select()
    .single();

  if (error) throw new Error(`createPayment: ${error.message}`);
  return rowToPayment(data as Record<string, unknown>);
}

export async function updatePaymentStatus(
  id: string,
  status: PaymentStatus,
  extras?: {
    gatewayRawResponse?: object;
    gatewayCardLast4?: string;
    gatewayCardBrand?: string;
    paidAt?: string;
    failedAt?: string;
  },
): Promise<void> {
  const sb = getSupabaseAdminClient();
  const { error } = await sb
    .from('payments')
    .update({
      status,
      ...(extras?.gatewayRawResponse ? { gateway_raw_response: extras.gatewayRawResponse } : {}),
      ...(extras?.gatewayCardLast4 ? { gateway_card_last4: extras.gatewayCardLast4 } : {}),
      ...(extras?.gatewayCardBrand ? { gateway_card_brand: extras.gatewayCardBrand } : {}),
      ...(extras?.paidAt ? { paid_at: extras.paidAt } : {}),
      ...(extras?.failedAt ? { failed_at: extras.failedAt } : {}),
    })
    .eq('id', id);
  if (error) throw new Error(`updatePaymentStatus: ${error.message}`);
}

export async function getPaymentByChargeId(chargeId: string): Promise<Payment | null> {
  const sb = getSupabaseAdminClient();
  const { data, error } = await sb
    .from('payments')
    .select('*')
    .eq('gateway_charge_id', chargeId)
    .single();
  if (error) return null;
  return rowToPayment(data as Record<string, unknown>);
}

// ── Seat Inventory ────────────────────────────────────────────────

export async function getSeatInventory(
  tourSlug: string,
  departureDate: string,
): Promise<SeatInventory | null> {
  const sb = getSupabaseAdminClient();
  const { data, error } = await sb
    .from('seat_inventory')
    .select('*')
    .eq('tour_slug', tourSlug)
    .eq('departure_date', departureDate)
    .single();
  if (error) return null;
  return rowToSeat(data as Record<string, unknown>);
}

export async function getAllSeatInventoryForTour(
  tourSlug: string,
): Promise<SeatInventory[]> {
  const sb = getSupabaseAdminClient();
  const { data, error } = await sb
    .from('seat_inventory')
    .select('*')
    .eq('tour_slug', tourSlug)
    .gte('departure_date', new Date().toISOString().split('T')[0])
    .order('departure_date');
  if (error) return [];
  return (data as Record<string, unknown>[]).map(rowToSeat);
}

export async function upsertSeatInventory(
  tourSlug: string,
  departureDate: string,
  totalSeats: number,
  options?: { externalRef?: string; syncSource?: string },
): Promise<SeatInventory> {
  const sb = getSupabaseAdminClient();
  const { data, error } = await sb
    .from('seat_inventory')
    .upsert(
      {
        tour_slug: tourSlug,
        departure_date: departureDate,
        total_seats: totalSeats,
        external_ref: options?.externalRef ?? null,
        sync_source: options?.syncSource ?? 'manual',
        last_synced_at: new Date().toISOString(),
      },
      { onConflict: 'tour_slug,departure_date', ignoreDuplicates: false },
    )
    .select()
    .single();
  if (error) throw new Error(`upsertSeatInventory: ${error.message}`);
  return rowToSeat(data as Record<string, unknown>);
}

/** Atomically hold seats — returns false if not enough available */
export async function holdSeats(
  tourSlug: string,
  departureDate: string,
  count: number,
): Promise<boolean> {
  const sb = getSupabaseAdminClient();
  const { data, error } = await sb.rpc('hold_seats', {
    p_tour_slug: tourSlug,
    p_departure: departureDate,
    p_count: count,
  });
  if (error) throw new Error(`holdSeats: ${error.message}`);
  return data as boolean;
}

/** Move seats from held → sold after payment succeeds */
export async function confirmSeats(
  tourSlug: string,
  departureDate: string,
  count: number,
): Promise<void> {
  const sb = getSupabaseAdminClient();
  await sb.rpc('confirm_seats', {
    p_tour_slug: tourSlug,
    p_departure: departureDate,
    p_count: count,
  });
}

/** Release held seats on booking cancellation / payment expiry */
export async function releaseHeldSeats(
  tourSlug: string,
  departureDate: string,
  count: number,
): Promise<void> {
  const sb = getSupabaseAdminClient();
  await sb.rpc('release_held_seats', {
    p_tour_slug: tourSlug,
    p_departure: departureDate,
    p_count: count,
  });
}

// ── SMS Queue ─────────────────────────────────────────────────────

export async function enqueueSms(
  bookingId: string,
  type: 'booking_confirm' | 'reminder_3day' | 'custom',
  recipientPhone: string,
  messageBody: string,
  scheduledAt?: Date,
): Promise<string> {
  const sb = getSupabaseAdminClient();
  const { data, error } = await sb
    .from('sms_notifications')
    .insert({
      booking_id: bookingId,
      type,
      recipient_phone: recipientPhone,
      message_body: messageBody,
      status: 'queued',
      provider: process.env.SMS_PROVIDER ?? 'log',
      scheduled_at: (scheduledAt ?? new Date()).toISOString(),
    })
    .select('id')
    .single();
  if (error) throw new Error(`enqueueSms: ${error.message}`);
  return (data as { id: string }).id;
}

export async function markSmsStatus(
  id: string,
  status: 'sent' | 'failed',
  options?: { providerMessageId?: string; providerError?: string },
): Promise<void> {
  const sb = getSupabaseAdminClient();
  await sb
    .from('sms_notifications')
    .update({
      status,
      ...(options?.providerMessageId ? { provider_message_id: options.providerMessageId } : {}),
      ...(options?.providerError ? { provider_error: options.providerError } : {}),
      ...(status === 'sent' ? { sent_at: new Date().toISOString() } : {}),
      ...(status === 'failed' ? { failed_at: new Date().toISOString() } : {}),
    })
    .eq('id', id);
}

/** Fetch SMS notifications due for sending right now */
export async function getDueSmsNotifications(limit = 50): Promise<
  { id: string; bookingId: string; recipientPhone: string; messageBody: string; type: string }[]
> {
  const sb = getSupabaseAdminClient();
  const { data, error } = await sb
    .from('sms_notifications')
    .select('id, booking_id, recipient_phone, message_body, type')
    .eq('status', 'queued')
    .lte('scheduled_at', new Date().toISOString())
    .limit(limit);
  if (error) return [];
  return (data as Record<string, unknown>[]).map((r) => ({
    id: r.id as string,
    bookingId: r.booking_id as string,
    recipientPhone: r.recipient_phone as string,
    messageBody: r.message_body as string,
    type: r.type as string,
  }));
}

/** Fetch bookings with departure = 3 days from now that haven't had a reminder sent */
export async function getBookingsDueForReminder(): Promise<Booking[]> {
  const sb = getSupabaseAdminClient();
  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
  const dateStr = threeDaysFromNow.toISOString().split('T')[0];

  const { data, error } = await sb
    .from('bookings')
    .select('*')
    .eq('departure_date', dateStr)
    .eq('status', 'confirmed')
    .eq('sms_reminder_sent', false);
  if (error) return [];
  return (data as Record<string, unknown>[]).map(rowToBooking);
}
