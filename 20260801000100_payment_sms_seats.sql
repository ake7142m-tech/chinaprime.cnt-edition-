-- ============================================================
--  China Prime — Payment, Seat Inventory & SMS System
--  Migration: 20260801000100
-- ============================================================

-- ── 1. Bookings ─────────────────────────────────────────────
create table if not exists public.bookings (
  id              uuid primary key default gen_random_uuid(),
  booking_ref     text not null unique,          -- e.g. "CP-20260801-001"
  tour_slug       text not null,
  tour_title      text not null default '',
  departure_date  date not null,
  status          text not null default 'pending'
                    check (status in ('pending','confirmed','cancelled','refunded')),

  -- Passenger / contact
  lead_name       text not null,
  lead_phone      text not null,
  lead_email      text not null default '',
  passenger_count integer not null default 1,
  special_requests text not null default '',

  -- Pricing
  price_per_person integer not null default 0,   -- THB satang → store as สตางค์ × 100
  deposit_amount   integer not null default 0,   -- THB satang
  total_amount     integer not null default 0,   -- THB satang

  -- Link to auth user (optional — guest bookings allowed)
  customer_user_id uuid references public.customer_users(id) on delete set null,

  -- SMS state
  sms_confirm_sent   boolean not null default false,
  sms_reminder_sent  boolean not null default false,

  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists bookings_tour_slug_idx       on public.bookings (tour_slug);
create index if not exists bookings_departure_date_idx  on public.bookings (departure_date);
create index if not exists bookings_status_idx          on public.bookings (status);
create index if not exists bookings_lead_phone_idx      on public.bookings (lead_phone);

-- ── 2. Payments ─────────────────────────────────────────────
create table if not exists public.payments (
  id              uuid primary key default gen_random_uuid(),
  booking_id      uuid not null references public.bookings(id) on delete cascade,
  amount          integer not null,              -- THB satang (e.g. 500000 = 5,000 THB)
  currency        text not null default 'THB',
  method          text not null                  -- 'promptpay' | 'credit_card'
                    check (method in ('promptpay','credit_card')),
  status          text not null default 'pending'
                    check (status in ('pending','processing','succeeded','failed','refunded')),

  -- Gateway fields (Omise / 2C2P)
  gateway         text not null default 'omise', -- 'omise' | '2c2p' | 'manual'
  gateway_charge_id   text,                      -- Omise charge ID / 2C2P paymentToken
  gateway_source_id   text,                      -- Omise source ID (PromptPay)
  gateway_card_last4  text,                      -- last 4 digits for card
  gateway_card_brand  text,                      -- 'visa' | 'mastercard' | 'jcb'
  gateway_raw_response jsonb,                    -- full webhook payload

  -- PromptPay specific
  promptpay_qr_data   text,                      -- raw EMV payload string
  promptpay_expires_at timestamptz,

  -- Timestamps
  paid_at         timestamptz,
  failed_at       timestamptz,
  created_at      timestamptz not null default timezone('utc', now()),
  updated_at      timestamptz not null default timezone('utc', now())
);

create index if not exists payments_booking_id_idx on public.payments (booking_id);
create index if not exists payments_status_idx     on public.payments (status);
create index if not exists payments_gateway_charge_id_idx on public.payments (gateway_charge_id);

-- ── 3. Seat Inventory ────────────────────────────────────────
-- Manages real-time seat availability per tour × departure date
create table if not exists public.seat_inventory (
  id              uuid primary key default gen_random_uuid(),
  tour_slug       text not null,
  departure_date  date not null,
  total_seats     integer not null default 20,
  held_seats      integer not null default 0,   -- pending bookings (not yet paid)
  sold_seats      integer not null default 0,   -- confirmed paid bookings
  last_synced_at  timestamptz,                  -- when external API was last polled
  sync_source     text not null default 'manual', -- 'manual' | 'airline_api' | 'operator_api'
  external_ref    text,                         -- external flight/tour reference code
  created_at      timestamptz not null default timezone('utc', now()),
  updated_at      timestamptz not null default timezone('utc', now()),

  unique (tour_slug, departure_date)
);

-- Computed column helper (available seats)
-- available = total_seats - held_seats - sold_seats
create index if not exists seat_inventory_tour_date_idx on public.seat_inventory (tour_slug, departure_date);
create index if not exists seat_inventory_sync_idx      on public.seat_inventory (last_synced_at);

-- ── 4. SMS Notifications ─────────────────────────────────────
-- Scheduled & sent SMS log
create table if not exists public.sms_notifications (
  id              uuid primary key default gen_random_uuid(),
  booking_id      uuid references public.bookings(id) on delete cascade,
  type            text not null                 -- 'booking_confirm' | 'reminder_3day' | 'custom'
                    check (type in ('booking_confirm','reminder_3day','custom')),
  recipient_phone text not null,
  message_body    text not null,
  status          text not null default 'queued'
                    check (status in ('queued','sent','failed','cancelled')),

  -- Provider response
  provider        text not null default 'telnyx', -- 'telnyx' | 'twilio' | 'thsms'
  provider_message_id  text,
  provider_error       text,

  -- Scheduling
  scheduled_at    timestamptz not null default timezone('utc', now()),
  sent_at         timestamptz,
  failed_at       timestamptz,

  created_at      timestamptz not null default timezone('utc', now()),
  updated_at      timestamptz not null default timezone('utc', now())
);

create index if not exists sms_booking_id_idx   on public.sms_notifications (booking_id);
create index if not exists sms_status_idx       on public.sms_notifications (status);
create index if not exists sms_scheduled_at_idx on public.sms_notifications (scheduled_at)
  where status = 'queued';

-- ── 5. Auto-update triggers ──────────────────────────────────
drop trigger if exists set_bookings_updated_at        on public.bookings;
create trigger set_bookings_updated_at
before update on public.bookings
for each row execute function public.set_updated_at();

drop trigger if exists set_payments_updated_at        on public.payments;
create trigger set_payments_updated_at
before update on public.payments
for each row execute function public.set_updated_at();

drop trigger if exists set_seat_inventory_updated_at  on public.seat_inventory;
create trigger set_seat_inventory_updated_at
before update on public.seat_inventory
for each row execute function public.set_updated_at();

drop trigger if exists set_sms_notifications_updated_at on public.sms_notifications;
create trigger set_sms_notifications_updated_at
before update on public.sms_notifications
for each row execute function public.set_updated_at();

-- ── 6. Helper: generate booking reference ───────────────────
create or replace function public.generate_booking_ref()
returns text
language plpgsql
as $$
declare
  ref text;
  today text;
  seq  integer;
begin
  today := to_char(now() at time zone 'Asia/Bangkok', 'YYYYMMDD');
  select count(*) + 1 into seq
    from public.bookings
   where booking_ref like 'CP-' || today || '-%';
  ref := 'CP-' || today || '-' || lpad(seq::text, 3, '0');
  return ref;
end;
$$;

-- ── 7. Helper: atomically reserve seats ─────────────────────
-- Returns TRUE if seats were successfully held, FALSE if not enough seats
create or replace function public.hold_seats(
  p_tour_slug    text,
  p_departure    date,
  p_count        integer
) returns boolean
language plpgsql
as $$
declare
  v_available integer;
begin
  select (total_seats - held_seats - sold_seats) into v_available
    from public.seat_inventory
   where tour_slug = p_tour_slug and departure_date = p_departure
   for update;

  if v_available is null or v_available < p_count then
    return false;
  end if;

  update public.seat_inventory
     set held_seats = held_seats + p_count
   where tour_slug = p_tour_slug and departure_date = p_departure;

  return true;
end;
$$;

-- ── 8. Helper: confirm seats on payment success ──────────────
create or replace function public.confirm_seats(
  p_tour_slug    text,
  p_departure    date,
  p_count        integer
) returns void
language plpgsql
as $$
begin
  update public.seat_inventory
     set held_seats = greatest(0, held_seats - p_count),
         sold_seats = sold_seats + p_count
   where tour_slug = p_tour_slug and departure_date = p_departure;
end;
$$;

-- ── 9. Helper: release held seats on cancel / expiry ─────────
create or replace function public.release_held_seats(
  p_tour_slug    text,
  p_departure    date,
  p_count        integer
) returns void
language plpgsql
as $$
begin
  update public.seat_inventory
     set held_seats = greatest(0, held_seats - p_count)
   where tour_slug = p_tour_slug and departure_date = p_departure;
end;
$$;

-- ── 10. Seed seat_inventory from existing join_tours data ────
-- Run manually after migration to pre-populate entries
-- insert into public.seat_inventory (tour_slug, departure_date, total_seats)
-- select slug, current_date + interval '30 days', 20 from public.join_tours;

-- ── 11. Enable Row Level Security (public-read, service-write) ─
alter table public.seat_inventory     enable row level security;
alter table public.bookings           enable row level security;
alter table public.payments           enable row level security;
alter table public.sms_notifications  enable row level security;

-- Allow anonymous read of seat inventory (for real-time availability widget)
create policy "seat_inventory_public_read"
  on public.seat_inventory for select
  to anon, authenticated
  using (true);

-- Bookings: owner can read their own
create policy "bookings_owner_read"
  on public.bookings for select
  to authenticated
  using (customer_user_id = auth.uid());

-- Service role bypasses RLS for all write operations
