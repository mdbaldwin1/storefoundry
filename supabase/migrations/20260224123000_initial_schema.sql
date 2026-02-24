create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.stores (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  slug text not null unique,
  status text not null default 'draft' check (status in ('draft', 'active', 'suspended')),
  stripe_account_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.store_domains (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  domain text not null unique,
  is_primary boolean not null default false,
  verification_status text not null default 'pending' check (verification_status in ('pending', 'verified', 'failed')),
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.store_branding (
  store_id uuid primary key references public.stores(id) on delete cascade,
  logo_path text,
  primary_color text,
  accent_color text,
  theme_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  title text not null,
  description text not null,
  price_cents integer not null check (price_cents >= 0),
  inventory_qty integer not null default 0 check (inventory_qty >= 0),
  status text not null default 'draft' check (status in ('draft', 'active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  customer_email text not null,
  currency text not null default 'usd',
  subtotal_cents integer not null check (subtotal_cents >= 0),
  total_cents integer not null check (total_cents >= 0),
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'cancelled')),
  stripe_payment_intent_id text,
  platform_fee_bps integer not null default 0 check (platform_fee_bps >= 0 and platform_fee_bps <= 10000),
  platform_fee_cents integer not null default 0 check (platform_fee_cents >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id),
  quantity integer not null check (quantity > 0),
  unit_price_cents integer not null check (unit_price_cents >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null unique references public.stores(id) on delete cascade,
  stripe_customer_id text not null,
  stripe_subscription_id text not null unique,
  plan_key text not null check (plan_key in ('free', 'starter', 'growth', 'scale')),
  status text not null check (status in ('active', 'past_due', 'cancelled', 'incomplete', 'trialing')),
  platform_fee_bps integer not null default 200 check (platform_fee_bps >= 0 and platform_fee_bps <= 10000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_store_domains_store_id on public.store_domains(store_id);
create index if not exists idx_products_store_id on public.products(store_id);
create index if not exists idx_products_status on public.products(status);
create index if not exists idx_orders_store_id on public.orders(store_id);
create index if not exists idx_order_items_order_id on public.order_items(order_id);

create trigger stores_set_updated_at
before update on public.stores
for each row execute function public.set_updated_at();

create trigger store_domains_set_updated_at
before update on public.store_domains
for each row execute function public.set_updated_at();

create trigger store_branding_set_updated_at
before update on public.store_branding
for each row execute function public.set_updated_at();

create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_updated_at();

create trigger orders_set_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

create trigger subscriptions_set_updated_at
before update on public.subscriptions
for each row execute function public.set_updated_at();

alter table public.stores enable row level security;
alter table public.store_domains enable row level security;
alter table public.store_branding enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.subscriptions enable row level security;

create policy stores_owner_all on public.stores
for all
using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());

create policy domains_owner_all on public.store_domains
for all
using (
  exists (
    select 1 from public.stores s
    where s.id = store_domains.store_id
      and s.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.stores s
    where s.id = store_domains.store_id
      and s.owner_user_id = auth.uid()
  )
);

create policy branding_owner_all on public.store_branding
for all
using (
  exists (
    select 1 from public.stores s
    where s.id = store_branding.store_id
      and s.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.stores s
    where s.id = store_branding.store_id
      and s.owner_user_id = auth.uid()
  )
);

create policy products_owner_all on public.products
for all
using (
  exists (
    select 1 from public.stores s
    where s.id = products.store_id
      and s.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.stores s
    where s.id = products.store_id
      and s.owner_user_id = auth.uid()
  )
);

create policy products_public_read on public.products
for select
using (status = 'active');

create policy orders_owner_all on public.orders
for all
using (
  exists (
    select 1 from public.stores s
    where s.id = orders.store_id
      and s.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.stores s
    where s.id = orders.store_id
      and s.owner_user_id = auth.uid()
  )
);

create policy order_items_owner_all on public.order_items
for all
using (
  exists (
    select 1
    from public.orders o
    join public.stores s on s.id = o.store_id
    where o.id = order_items.order_id
      and s.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.orders o
    join public.stores s on s.id = o.store_id
    where o.id = order_items.order_id
      and s.owner_user_id = auth.uid()
  )
);

create policy subscriptions_owner_all on public.subscriptions
for all
using (
  exists (
    select 1 from public.stores s
    where s.id = subscriptions.store_id
      and s.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.stores s
    where s.id = subscriptions.store_id
      and s.owner_user_id = auth.uid()
  )
);

create policy stores_public_read on public.stores
for select
using (status = 'active');

create policy domains_public_verified_read on public.store_domains
for select
using (verification_status = 'verified');
