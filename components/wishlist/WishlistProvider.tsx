"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  toggleWishlist as toggleWishlistAction,
  type WishlistActionResult,
} from "@/lib/wishlist/actions";

type WishlistContextValue = {
  ids: Set<string>;
  count: number;
  isAuthenticated: boolean;
  has: (productId: string) => boolean;
  toggle: (productId: string) => Promise<WishlistActionResult>;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
}

export default function WishlistProvider({
  children,
  isAuthenticated,
  initialIds,
}: {
  children: React.ReactNode;
  isAuthenticated: boolean;
  initialIds: string[];
}) {
  const [ids, setIds] = useState<Set<string>>(() => new Set(initialIds));

  // Auth değişiminde (giriş/çıkış) server'dan gelen yeni id setine resync et.
  // Çıkışta initialIds=[] gelir, eski kalp state'inin client'ta kalmasını engeller.
  const initialKey = `${isAuthenticated}|${[...initialIds].sort().join(",")}`;
  useEffect(() => {
    setIds(new Set(initialIds));
    // initialKey değişimi izlenir; initialIds referansı her render değişir, key dedupe sağlar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialKey]);

  const has = useCallback((productId: string) => ids.has(productId), [ids]);

  const toggle = useCallback(
    async (productId: string): Promise<WishlistActionResult> => {
      if (!isAuthenticated) return { ok: false, error: "AUTH_REQUIRED" };

      const wasIn = ids.has(productId);
      setIds((prev) => {
        const next = new Set(prev);
        if (wasIn) next.delete(productId);
        else next.add(productId);
        return next;
      });

      const res = await toggleWishlistAction(productId);
      if (!res.ok) {
        setIds((prev) => {
          const next = new Set(prev);
          if (wasIn) next.add(productId);
          else next.delete(productId);
          return next;
        });
      }
      return res;
    },
    [ids, isAuthenticated],
  );

  return (
    <WishlistContext.Provider value={{ ids, count: ids.size, isAuthenticated, has, toggle }}>
      {children}
    </WishlistContext.Provider>
  );
}
