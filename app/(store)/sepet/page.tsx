import type { Metadata } from "next";
import StoreHeaderShell from "@/components/StoreHeaderShell";
import CartView from "./CartView";

export const metadata: Metadata = { title: "Sepetim" };

export default function SepetPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#090909", color: "#e5e5e5", fontFamily: "system-ui, sans-serif" }}>
      <StoreHeaderShell />
      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px 80px" }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 28 }}>Sepetim</h1>
        <CartView />
      </main>
    </div>
  );
}
