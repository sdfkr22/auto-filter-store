-- =============================================
-- auto-filter-store | Tam DB Şeması
-- Supabase SQL Editor'de çalıştır
-- =============================================

-- Kategoriler
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name_tr text not null,
  name_en text not null,
  icon text,
  color text,
  sort_order int default 0
);

-- Ürünler
create table public.products (
  id uuid primary key default gen_random_uuid(),
  mann_code text unique not null,
  mann_name text,
  filtron_code text,
  category_id uuid references public.categories(id),
  label_tr text,
  label_en text,
  mann_url text,
  filtron_url text,
  images text[] default '{}',
  price numeric not null default 0,
  price_en numeric,
  compare_price numeric,
  stock int not null default 0,
  reserved_stock int not null default 0,
  active boolean not null default true,
  featured boolean not null default false,
  description_tr text,
  description_en text,
  meta_title_tr text,
  meta_desc_tr text,
  meta_title_en text,
  meta_desc_en text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Profiller (Supabase Auth ile bağlantılı)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  tc_no text,
  tax_no text,
  tax_office text,
  is_corporate boolean not null default false,
  role text not null default 'customer',
  newsletter boolean not null default false,
  created_at timestamptz default now()
);

-- Adresler
create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  full_name text not null,
  phone text not null,
  full_address text not null,
  city text not null,
  district text not null,
  zip text,
  is_default boolean not null default false,
  is_billing boolean not null default false
);

-- Favoriler
create table public.wishlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz default now(),
  unique(user_id, product_id)
);

-- Ürün Yorumları
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  title text,
  body text,
  approved boolean not null default false,
  created_at timestamptz default now()
);

-- Kuponlar
create table public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  type text not null check (type in ('percent', 'fixed')),
  value numeric not null,
  min_order_amount numeric not null default 0,
  max_uses int,
  used_count int not null default 0,
  valid_from timestamptz,
  valid_until timestamptz,
  active boolean not null default true
);

-- Kargo Yöntemleri
create table public.shipping_methods (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  company text not null,
  price numeric not null,
  free_above numeric,
  estimated_days text,
  active boolean not null default true
);

-- Sepet
create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  quantity int not null default 1 check (quantity > 0),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, product_id)
);

-- Siparişler
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_no text unique not null,
  user_id uuid not null references public.profiles(id),
  status text not null default 'pending'
    check (status in ('pending','awaiting_payment','paid','preparing','shipped','delivered','cancelled','refunded')),
  subtotal numeric not null,
  shipping_cost numeric not null default 0,
  discount_amount numeric not null default 0,
  total numeric not null,
  currency text not null default 'TRY',
  locale text not null default 'tr',
  coupon_id uuid references public.coupons(id),
  shipping_method_id uuid references public.shipping_methods(id),
  shipping_address_id uuid references public.addresses(id),
  billing_address_id uuid references public.addresses(id),
  payment_method text check (payment_method in ('credit_card','bank_transfer')),
  iyzico_payment_id text,
  bank_transfer_ref text,
  cargo_company text,
  cargo_tracking_no text,
  einvoice_id text,
  einvoice_pdf_url text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Sipariş Kalemleri
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id),
  mann_code text not null,
  product_name text not null,
  quantity int not null,
  unit_price numeric not null,
  total_price numeric not null
);

-- İade Talepleri
create table public.returns (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id),
  user_id uuid not null references public.profiles(id),
  status text not null default 'requested'
    check (status in ('requested','approved','rejected','refunded')),
  reason text not null,
  description text,
  refund_amount numeric,
  iyzico_refund_id text,
  created_at timestamptz default now(),
  resolved_at timestamptz
);

-- Kampanya Bannerları
create table public.banners (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text,
  image_url text,
  link text,
  sort_order int default 0,
  active boolean not null default true,
  valid_from timestamptz,
  valid_until timestamptz
);

-- Bülten Aboneleri
create table public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  locale text not null default 'tr',
  subscribed boolean not null default true,
  confirmed boolean not null default false,
  created_at timestamptz default now()
);

-- Admin İşlem Logu
create table public.admin_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references public.profiles(id),
  action text not null,
  target_table text,
  target_id uuid,
  old_value jsonb,
  new_value jsonb,
  created_at timestamptz default now()
);

-- =============================================
-- Seed: 4 Kategori
-- =============================================

insert into public.categories (slug, name_tr, name_en, icon, color, sort_order) values
  ('yag-filtresi',   'Yağ Filtresi',   'Oil Filter',   '🛢️', '#f59e0b', 1),
  ('hava-filtresi',  'Hava Filtresi',  'Air Filter',   '💨', '#3b82f6', 2),
  ('polen-filtresi', 'Polen Filtresi', 'Cabin Filter', '🌿', '#10b981', 3),
  ('yakit-filtresi', 'Yakıt Filtresi', 'Fuel Filter',  '⛽', '#ef4444', 4);

-- =============================================
-- Seed: Varsayılan Kargo Yöntemleri
-- =============================================

insert into public.shipping_methods (name, company, price, free_above, estimated_days) values
  ('Yurtiçi Kargo', 'yurtici', 49.90, 500, '2-4 iş günü'),
  ('Aras Kargo',    'aras',    44.90, 500, '2-4 iş günü'),
  ('MNG Kargo',     'mng',     44.90, 500, '3-5 iş günü');

-- =============================================
-- Trigger: updated_at otomatik güncelle
-- =============================================

create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger products_updated_at before update on public.products
  for each row execute function public.handle_updated_at();

create trigger orders_updated_at before update on public.orders
  for each row execute function public.handle_updated_at();

create trigger cart_items_updated_at before update on public.cart_items
  for each row execute function public.handle_updated_at();

-- =============================================
-- Trigger: Yeni kullanıcı → profil otomatik oluştur
-- =============================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =============================================
-- RLS (Row Level Security)
-- =============================================

alter table public.profiles enable row level security;
alter table public.addresses enable row level security;
alter table public.wishlists enable row level security;
alter table public.cart_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.returns enable row level security;
alter table public.reviews enable row level security;
alter table public.products enable row level security;
alter table public.categories enable row level security;
alter table public.shipping_methods enable row level security;
alter table public.coupons enable row level security;
alter table public.banners enable row level security;
alter table public.newsletter_subscribers enable row level security;
alter table public.admin_logs enable row level security;

-- Herkes okuyabilir
create policy "products_public_read" on public.products for select using (active = true);
create policy "categories_public_read" on public.categories for select using (true);
create policy "shipping_public_read" on public.shipping_methods for select using (active = true);
create policy "banners_public_read" on public.banners for select using (active = true);

-- Kendi profilini yönet
create policy "profiles_own" on public.profiles
  for all using (auth.uid() = id);

-- Kendi adreslerini yönet
create policy "addresses_own" on public.addresses
  for all using (auth.uid() = user_id);

-- Kendi favorilerini yönet
create policy "wishlists_own" on public.wishlists
  for all using (auth.uid() = user_id);

-- Kendi sepetini yönet
create policy "cart_own" on public.cart_items
  for all using (auth.uid() = user_id);

-- Kendi siparişlerini gör
create policy "orders_own_read" on public.orders
  for select using (auth.uid() = user_id);

create policy "orders_own_insert" on public.orders
  for insert with check (auth.uid() = user_id);

-- Sipariş kalemlerini gör (kendi siparişlerine ait)
create policy "order_items_own_read" on public.order_items
  for select using (
    exists (select 1 from public.orders where id = order_id and user_id = auth.uid())
  );

-- Kendi iade taleplerini yönet
create policy "returns_own" on public.returns
  for all using (auth.uid() = user_id);

-- Onaylı yorumları herkes görebilir, kullanıcı kendi yorumunu ekleyebilir
create policy "reviews_approved_read" on public.reviews
  for select using (approved = true);

create policy "reviews_own_insert" on public.reviews
  for insert with check (auth.uid() = user_id);

-- Bülten: insert herkese açık
create policy "newsletter_insert" on public.newsletter_subscribers
  for insert with check (true);
