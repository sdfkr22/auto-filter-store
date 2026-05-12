-- =============================================
-- V2.5 — Ödeme altyapısı
-- Supabase SQL Editor'de çalıştır
-- =============================================

-- Sipariş numarası sekansı: AF-2026-00001
create sequence if not exists public.order_no_seq start 1;

create or replace function public.generate_order_no()
returns text
language sql
as $$
  select 'AF-' || to_char(now(), 'YYYY') || '-' ||
         lpad(nextval('public.order_no_seq')::text, 5, '0');
$$;

-- =============================================
-- Atomic stok düşüm + reservation temizleme
-- Ödeme başarılı olunca tek transaction'da çağrılır.
-- items: [{ "product_id": "...", "quantity": 1 }, ...]
-- Stok yetmezse exception fırlatır → orders.status pending kalır.
-- =============================================
create or replace function public.finalize_order_stock(p_items jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  item record;
  current_stock int;
begin
  for item in
    select (value->>'product_id')::uuid as product_id,
           (value->>'quantity')::int    as quantity
    from jsonb_array_elements(p_items)
  loop
    select stock into current_stock
    from public.products
    where id = item.product_id
    for update;

    if current_stock is null then
      raise exception 'PRODUCT_NOT_FOUND: %', item.product_id;
    end if;
    if current_stock < item.quantity then
      raise exception 'OUT_OF_STOCK: %', item.product_id;
    end if;

    update public.products
       set stock = stock - item.quantity,
           reserved_stock = greatest(0, reserved_stock - item.quantity)
     where id = item.product_id;
  end loop;
end;
$$;

revoke all on function public.finalize_order_stock(jsonb) from public, anon, authenticated;

-- =============================================
-- Stok rezervasyonunu serbest bırak (iptal / havale timeout)
-- =============================================
create or replace function public.release_order_reservation(p_items jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  item record;
begin
  for item in
    select (value->>'product_id')::uuid as product_id,
           (value->>'quantity')::int    as quantity
    from jsonb_array_elements(p_items)
  loop
    update public.products
       set reserved_stock = greatest(0, reserved_stock - item.quantity)
     where id = item.product_id;
  end loop;
end;
$$;

revoke all on function public.release_order_reservation(jsonb) from public, anon, authenticated;
