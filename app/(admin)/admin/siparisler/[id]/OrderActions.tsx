"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  updateOrderStatus,
  confirmBankTransfer,
  cancelOrder,
  setCargoTracking,
} from "@/lib/admin/order-actions";

const NEXT_STATUS: Record<string, { value: string; label: string }[]> = {
  pending: [],                  // ödeme akışı doldurur, admin sadece iptal eder
  awaiting_payment: [],         // havale onayı ayrı buton
  paid: [{ value: "preparing", label: "Hazırlanıyor olarak işaretle" }],
  preparing: [],                // kargoya verince setCargoTracking shipped'e geçirir
  shipped: [{ value: "delivered", label: "Teslim Edildi olarak işaretle" }],
  delivered: [],
  cancelled: [],
  refunded: [],
};

export default function OrderActions({
  orderId,
  status,
  paymentMethod,
  cargoCompany,
  cargoTrackingNo,
}: {
  orderId: string;
  status: string;
  paymentMethod: string;
  cargoCompany: string;
  cargoTrackingNo: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const [bankRef, setBankRef] = useState("");
  const [carCompany, setCarCompany] = useState(cargoCompany);
  const [carNo, setCarNo] = useState(cargoTrackingNo);

  function run(fn: () => Promise<{ ok: true } | { ok: false; error: string }>) {
    setErr(null);
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) {
        setErr(res.error);
        return;
      }
      router.refresh();
    });
  }

  const canCancel = !["cancelled", "refunded", "delivered"].includes(status);
  const transitions = NEXT_STATUS[status] ?? [];

  return (
    <aside style={{ position: "sticky", top: 20, display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Havale onayı */}
      {status === "awaiting_payment" && paymentMethod === "bank_transfer" && (
        <div style={card}>
          <div style={cardTitle}>Havale Onayı</div>
          <div style={{ fontSize: 12, color: "#aaa", lineHeight: 1.5, marginBottom: 10 }}>
            Banka ekstresinden referans/dekont numarasını girip onaylayın. Stok düşülecek, sipariş "Ödendi" olacak.
          </div>
          <input
            value={bankRef}
            onChange={(e) => setBankRef(e.target.value)}
            placeholder="Dekont / referans no"
            style={input}
          />
          <button
            disabled={pending || !bankRef.trim()}
            onClick={() => run(() => confirmBankTransfer(orderId, bankRef))}
            style={primaryBtn(pending || !bankRef.trim())}
          >
            {pending ? "Onaylanıyor…" : "Havaleyi Onayla"}
          </button>
        </div>
      )}

      {/* Kargo bilgileri */}
      {["paid", "preparing", "shipped"].includes(status) && (
        <div style={card}>
          <div style={cardTitle}>{status === "shipped" ? "Kargo Bilgisi" : "Kargoya Ver"}</div>
          <label style={label}>Kargo Firması</label>
          <input value={carCompany} onChange={(e) => setCarCompany(e.target.value)} placeholder="Yurtiçi / Aras / MNG" style={input} />
          <label style={label}>Takip Numarası</label>
          <input value={carNo} onChange={(e) => setCarNo(e.target.value)} placeholder="1234567890" style={input} />
          <button
            disabled={pending || !carCompany.trim() || !carNo.trim()}
            onClick={() => run(() => setCargoTracking(orderId, carCompany, carNo))}
            style={primaryBtn(pending || !carCompany.trim() || !carNo.trim())}
          >
            {pending ? "Kaydediliyor…" : status === "shipped" ? "Güncelle" : "Kargoya Verildi"}
          </button>
        </div>
      )}

      {/* Durum geçişleri */}
      {transitions.length > 0 && (
        <div style={card}>
          <div style={cardTitle}>Durum</div>
          {transitions.map((t) => (
            <button
              key={t.value}
              disabled={pending}
              onClick={() => run(() => updateOrderStatus(orderId, t.value))}
              style={{ ...secondaryBtn, marginBottom: 8 }}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* İptal */}
      {canCancel && (
        <div style={card}>
          <div style={cardTitle}>Tehlikeli</div>
          <div style={{ fontSize: 12, color: "#aaa", lineHeight: 1.5, marginBottom: 10 }}>
            {status === "pending" || status === "awaiting_payment"
              ? "Rezerve stok serbest bırakılacak."
              : "Stok geri eklenecek (zaten finalize edilmişti). Refund varsa ayrıca yapılmalı."}
          </div>
          <button
            disabled={pending}
            onClick={() => {
              if (confirm("Bu siparişi iptal etmek istediğinizden emin misiniz?")) {
                run(() => cancelOrder(orderId));
              }
            }}
            style={dangerBtn}
          >
            {pending ? "İşleniyor…" : "Siparişi İptal Et"}
          </button>
        </div>
      )}

      {err && (
        <div style={{ background: "#3a1a1a", border: "1px solid #5a2020", borderRadius: 6, padding: "10px 12px", fontSize: 12, color: "#e05252" }}>
          {err}
        </div>
      )}
    </aside>
  );
}

const card: React.CSSProperties = {
  background: "#141414",
  border: "1px solid #222",
  borderRadius: 8,
  padding: 16,
};
const cardTitle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: "#e5e5e5",
  marginBottom: 12,
  textTransform: "uppercase",
  letterSpacing: 0.5,
};
const label: React.CSSProperties = {
  display: "block",
  fontSize: 11,
  color: "#888",
  marginBottom: 5,
  marginTop: 8,
};
const input: React.CSSProperties = {
  width: "100%",
  background: "#0c0c0c",
  border: "1px solid #222",
  borderRadius: 6,
  padding: "9px 11px",
  color: "#e5e5e5",
  fontSize: 13,
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "inherit",
  marginBottom: 6,
};
const primaryBtn = (disabled: boolean): React.CSSProperties => ({
  width: "100%",
  marginTop: 10,
  background: disabled ? "#1a1a1a" : "#FFED00",
  color: disabled ? "#555" : "#0a0a0a",
  border: "none",
  borderRadius: 6,
  padding: "10px",
  fontSize: 13,
  fontWeight: 700,
  cursor: disabled ? "not-allowed" : "pointer",
  fontFamily: "inherit",
});
const secondaryBtn: React.CSSProperties = {
  width: "100%",
  background: "#1a2a3a",
  color: "#7a9ad1",
  border: "1px solid #2a3a4a",
  borderRadius: 6,
  padding: "10px",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "inherit",
};
const dangerBtn: React.CSSProperties = {
  width: "100%",
  background: "transparent",
  color: "#d17a7a",
  border: "1px solid #5a2020",
  borderRadius: 6,
  padding: "10px",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "inherit",
};
