"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  addToCart as addToCartAction,
  updateCartQuantity as updateCartQuantityAction,
  getCart as getCartAction,
  mergeGuestCart as mergeGuestCartAction,
  type CartItem,
  type CartActionResult,
} from "@/lib/cart/actions";

type GuestItem = { productId: string; quantity: number };
const STORAGE_KEY = "auto-filter:cart";

function readGuestCart(): GuestItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data.filter(
      (i): i is GuestItem =>
        typeof i?.productId === "string" && typeof i?.quantity === "number" && i.quantity > 0,
    );
  } catch {
    return [];
  }
}

function writeGuestCart(items: GuestItem[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {}
}

function clearGuestCart() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

type ProductPayload = {
  id: string;
  product_name: string;
  product_fancy_name: string | null;
  product_type: string;
  image_url: string | null;
  price: number;
  compare_price: number | null;
  stock: number;
};

async function fetchProducts(ids: string[]): Promise<ProductPayload[]> {
  if (ids.length === 0) return [];
  try {
    const r = await fetch("/api/cart/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    const d = await r.json();
    return Array.isArray(d.products) ? d.products : [];
  } catch {
    return [];
  }
}

type CartContextValue = {
  items: CartItem[];
  count: number;
  total: number;
  loading: boolean;
  isAuthenticated: boolean;
  addItem: (productId: string, quantity?: number) => Promise<CartActionResult>;
  updateQty: (productId: string, quantity: number) => Promise<CartActionResult>;
  removeItem: (productId: string) => Promise<CartActionResult>;
};

const CartContext = createContext<CartContextValue | null>(null);

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

export default function CartProvider({
  children,
  isAuthenticated,
  initialItems,
}: {
  children: React.ReactNode;
  isAuthenticated: boolean;
  initialItems: CartItem[];
}) {
  const [items, setItems] = useState<CartItem[]>(initialItems);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      const guest = readGuestCart();

      if (isAuthenticated) {
        if (guest.length > 0) {
          await mergeGuestCartAction(guest);
          clearGuestCart();
          const fresh = await getCartAction();
          if (!cancelled) setItems(fresh);
        }
        if (!cancelled) setLoading(false);
        return;
      }

      if (guest.length === 0) {
        if (!cancelled) setLoading(false);
        return;
      }

      const products = await fetchProducts(guest.map((g) => g.productId));
      const byId = new Map(products.map((p) => [p.id, p]));
      const hydrated: CartItem[] = guest
        .map((g): CartItem | null => {
          const p = byId.get(g.productId);
          if (!p) return null;
          return {
            productId: p.id,
            productName: p.product_name,
            productFancyName: p.product_fancy_name,
            productType: p.product_type,
            imageUrl: p.image_url,
            price: p.price,
            comparePrice: p.compare_price,
            stock: p.stock,
            quantity: Math.min(g.quantity, p.stock),
          };
        })
        .filter((x): x is CartItem => x !== null);

      if (!cancelled) {
        setItems(hydrated);
        writeGuestCart(hydrated.map((h) => ({ productId: h.productId, quantity: h.quantity })));
        setLoading(false);
      }
    }

    hydrate();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const addItem = useCallback(
    async (productId: string, quantity = 1): Promise<CartActionResult> => {
      if (quantity < 1) return { ok: false, error: "INVALID_QUANTITY" };

      if (isAuthenticated) {
        const res = await addToCartAction(productId, quantity);
        if (res.ok) setItems(await getCartAction());
        return res;
      }

      const products = await fetchProducts([productId]);
      const p = products[0];
      if (!p) return { ok: false, error: "PRODUCT_NOT_FOUND" };

      let result: CartActionResult = { ok: true };
      setItems((prev) => {
        const existingIdx = prev.findIndex((i) => i.productId === productId);
        const currentQty = existingIdx >= 0 ? prev[existingIdx].quantity : 0;
        const newQty = currentQty + quantity;
        if (newQty > p.stock) {
          result = { ok: false, error: "OUT_OF_STOCK" };
          return prev;
        }
        const next: CartItem[] =
          existingIdx >= 0
            ? prev.map((i, idx) => (idx === existingIdx ? { ...i, quantity: newQty } : i))
            : [
                ...prev,
                {
                  productId: p.id,
                  productName: p.product_name,
                  productFancyName: p.product_fancy_name,
                  productType: p.product_type,
                  imageUrl: p.image_url,
                  price: p.price,
                  comparePrice: p.compare_price,
                  stock: p.stock,
                  quantity: newQty,
                },
              ];
        writeGuestCart(next.map((n) => ({ productId: n.productId, quantity: n.quantity })));
        return next;
      });
      return result;
    },
    [isAuthenticated],
  );

  const updateQty = useCallback(
    async (productId: string, quantity: number): Promise<CartActionResult> => {
      if (quantity < 0) return { ok: false, error: "INVALID_QUANTITY" };

      if (isAuthenticated) {
        const res = await updateCartQuantityAction(productId, quantity);
        if (res.ok) setItems(await getCartAction());
        return res;
      }

      let result: CartActionResult = { ok: true };
      setItems((prev) => {
        const existing = prev.find((i) => i.productId === productId);
        if (!existing) {
          result = { ok: false, error: "NOT_IN_CART" };
          return prev;
        }
        if (quantity > existing.stock) {
          result = { ok: false, error: "OUT_OF_STOCK" };
          return prev;
        }
        const next =
          quantity === 0
            ? prev.filter((i) => i.productId !== productId)
            : prev.map((i) => (i.productId === productId ? { ...i, quantity } : i));
        writeGuestCart(next.map((n) => ({ productId: n.productId, quantity: n.quantity })));
        return next;
      });
      return result;
    },
    [isAuthenticated],
  );

  const removeItem = useCallback(
    (productId: string) => updateQty(productId, 0),
    [updateQty],
  );

  const count = items.reduce((s, i) => s + i.quantity, 0);
  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, count, total, loading, isAuthenticated, addItem, updateQty, removeItem }}
    >
      {children}
    </CartContext.Provider>
  );
}
