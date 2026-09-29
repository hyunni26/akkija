-- =====================================================================
-- akkija 가계부 — Supabase 스키마
-- Supabase 대시보드 > SQL Editor 에 전체를 붙여넣고 한 번 실행하세요.
-- 기본 카테고리는 앱 첫 로그인 시 자동으로 생성됩니다.
-- =====================================================================

-- ---------- 카테고리 ----------
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  type        text not null check (type in ('income', 'expense')),
  name        text not null check (char_length(name) between 1 and 20),
  icon        text not null default 'circle',
  color       text not null default 'sage',
  sort_order  integer not null default 0,
  is_hidden   boolean not null default false,
  created_at  timestamptz not null default now()
);

-- ---------- 카드 ----------
create table if not exists public.cards (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 20),
  sort_order  integer not null default 0,
  is_hidden   boolean not null default false,
  created_at  timestamptz not null default now()
);

-- ---------- 고정지출 ----------
create table if not exists public.recurring (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name            text not null check (char_length(name) between 1 and 30),
  amount          bigint not null check (amount > 0),
  category_id     uuid not null references public.categories (id) on delete restrict,
  payment_method  text not null check (payment_method in ('card', 'cash')),
  card_id         uuid references public.cards (id) on delete restrict,
  memo            text check (memo is null or char_length(memo) <= 100),
  start_month     date not null,               -- 해당 월 1일
  end_month       date,                        -- 해당 월 1일, null = 계속
  is_hidden       boolean not null default false,
  created_at      timestamptz not null default now(),
  constraint recurring_card_chk check (
    (payment_method = 'card' and card_id is not null) or
    (payment_method = 'cash' and card_id is null)
  ),
  constraint recurring_month_chk check (
    extract(day from start_month) = 1 and
    (end_month is null or (extract(day from end_month) = 1 and end_month >= start_month))
  )
);

-- ---------- 내역 ----------
create table if not exists public.transactions (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null default auth.uid() references auth.users (id) on delete cascade,
  tx_date          date not null,
  type             text not null check (type in ('income', 'expense')),
  amount           bigint not null check (amount > 0),
  category_id      uuid not null references public.categories (id) on delete restrict,
  payment_method   text check (payment_method in ('card', 'cash')),
  card_id          uuid references public.cards (id) on delete restrict,
  memo             text check (memo is null or char_length(memo) <= 100),
  recurring_id     uuid references public.recurring (id) on delete set null,
  recurring_month  date,                       -- 어느 달 고정지출을 확정한 것인지 (해당 월 1일)
  created_at       timestamptz not null default now(),
  constraint tx_payment_chk check (
    (type = 'income'  and payment_method is null and card_id is null) or
    (type = 'expense' and payment_method = 'cash' and card_id is null) or
    (type = 'expense' and payment_method = 'card' and card_id is not null)
  ),
  constraint tx_recurring_chk check (
    recurring_id is null or recurring_month is not null
  ),
  constraint tx_recurring_once unique (recurring_id, recurring_month)
);

create index if not exists transactions_user_date_idx on public.transactions (user_id, tx_date);
create index if not exists transactions_recurring_idx on public.transactions (recurring_id, recurring_month);

-- ---------- RLS: 로그인한 본인 데이터만 ----------
alter table public.categories   enable row level security;
alter table public.cards        enable row level security;
alter table public.recurring    enable row level security;
alter table public.transactions enable row level security;

drop policy if exists "own rows" on public.categories;
drop policy if exists "own rows" on public.cards;
drop policy if exists "own rows" on public.recurring;
drop policy if exists "own rows" on public.transactions;

create policy "own rows" on public.categories
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own rows" on public.cards
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own rows" on public.recurring
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own rows" on public.transactions
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- 비로그인(anon)은 접근 불가, 로그인 사용자만 API 접근 허용
revoke all on public.categories, public.cards, public.recurring, public.transactions from anon;
grant select, insert, update, delete
  on public.categories, public.cards, public.recurring, public.transactions
  to authenticated;
