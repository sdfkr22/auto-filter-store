import type { ReactNode } from "react";
import StoreHeaderShell from "@/components/StoreHeaderShell";

export default function LegalPageShell({ title, lastUpdated, children }: {
  title: string;
  lastUpdated?: string;
  children: ReactNode;
}) {
  return (
    <div style={{ minHeight: "100vh", background: "#090909", color: "#e5e5e5", fontFamily: "system-ui, sans-serif" }}>
      <StoreHeaderShell />
      <main style={{ maxWidth: 820, margin: "0 auto", padding: "40px 24px 80px" }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>{title}</h1>
        {lastUpdated && (
          <div style={{ fontSize: 12, color: "#777", marginBottom: 28 }}>
            Son güncelleme: {lastUpdated}
          </div>
        )}
        <div style={{ fontSize: 14, color: "#ccc", lineHeight: 1.75 }}>
          {children}
        </div>
      </main>
    </div>
  );
}
