"use client";

import { useMemo, useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { createAddress } from "./actions";
import { initiateCardPayment, initiateBankTransfer } from "@/lib/checkout/actions";
import LegalModal from "@/components/LegalModal";
import MesafeliSatisContent from "../mesafeli-satis-sozlesmesi/Content";
import OnBilgilendirmeContent from "../on-bilgilendirme-formu/Content";
import type { CartItem } from "@/lib/cart/actions";

type Address = {
  id: string;
  title: string;
  full_name: string;
  phone: string;
  full_address: string;
  city: string;
  district: string;
  zip: string | null;
  is_default: boolean;
  is_billing: boolean;
};

type ShippingMethod = {
  id: string;
  name: string;
  company: string;
  price: number;
  free_above: number | null;
  estimated_days: string | null;
};

const fmt = (n: number) => `₺${n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const s = {
  steps: { display: "flex", flexDirection: "column" as const, gap: 14 },
  card: { background: "#0c0c0c", border: "1px solid #1a1a1a", borderRadius: 12, padding: 22 } as const,
  cardDone: { background: "#0c0c0c", border: "1px solid #1a1a1a", borderRadius: 12, padding: "14px 22px", display: "flex", justifyContent: "space-between", alignItems: "center" } as const,
  stepTitle: { fontSize: 15, fontWeight: 700, color: "#e5e5e5", marginBottom: 14 } as const,
  stepDoneTitle: { fontSize: 13, fontWeight: 600, color: "#888" } as const,
  stepDoneValue: { fontSize: 13, color: "#e5e5e5", marginTop: 2 } as const,
  editBtn: { background: "transparent", border: "1px solid #2a2a2a", borderRadius: 6, padding: "5px 12px", color: "#aaa", fontSize: 12, cursor: "pointer", fontFamily: "inherit" } as const,
  primaryBtn: (disabled = false) => ({
    display: "inline-block", marginTop: 16, background: disabled ? "#1a1a1a" : "#FFED00", color: disabled ? "#555" : "#0a0a0a",
    border: "none", borderRadius: 8, padding: "11px 22px", fontSize: 14, fontWeight: 700,
    cursor: disabled ? "not-allowed" : "pointer", fontFamily: "inherit",
  }) as const,
  ghostBtn: { background: "transparent", border: "1px solid #2a2a2a", borderRadius: 8, padding: "9px 18px", color: "#aaa", fontSize: 13, cursor: "pointer", fontFamily: "inherit", marginRight: 8 } as const,
  addressGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 } as const,
  addressCard: (selected: boolean) => ({
    background: selected ? "#FFED0010" : "#111",
    border: `1px solid ${selected ? "#FFED00" : "#1e1e1e"}`,
    borderRadius: 10, padding: 14, cursor: "pointer",
    transition: "all .15s",
  }) as const,
  addrTitle: { fontSize: 13, fontWeight: 700, color: "#e5e5e5", marginBottom: 4 } as const,
  addrLine: { fontSize: 12, color: "#aaa", lineHeight: 1.5 } as const,
  newAddrBtn: { display: "block", width: "100%", marginTop: 10, background: "transparent", border: "1px dashed #2a2a2a", borderRadius: 10, padding: 12, color: "#888", fontSize: 13, cursor: "pointer", fontFamily: "inherit" } as const,
  label: { display: "block", fontSize: 12, color: "#888", marginBottom: 5 } as const,
  input: { width: "100%", background: "#111", border: "1px solid #1e1e1e", borderRadius: 6, padding: "9px 11px", color: "#e5e5e5", fontSize: 13, outline: "none", boxSizing: "border-box" as const, fontFamily: "inherit" },
  field: { marginBottom: 10 } as const,
  shippingRow: (selected: boolean) => ({
    display: "flex", justifyContent: "space-between", alignItems: "center",
    background: selected ? "#FFED0010" : "#111",
    border: `1px solid ${selected ? "#FFED00" : "#1e1e1e"}`,
    borderRadius: 10, padding: "12px 14px", cursor: "pointer", marginBottom: 8,
  }) as const,
  payTabs: { display: "flex", gap: 0, marginBottom: 18 } as const,
  payTab: (active: boolean, first: boolean) => ({
    flex: 1, padding: "10px",
    fontSize: 13, fontWeight: 600,
    background: active ? "#FFED00" : "#111",
    color: active ? "#0a0a0a" : "#888",
    border: "1px solid #1e1e1e",
    borderRight: first ? "none" : "1px solid #1e1e1e",
    borderRadius: first ? "8px 0 0 8px" : "0 8px 8px 0",
    cursor: "pointer", fontFamily: "inherit",
  }) as const,
  checkRow: { display: "flex", gap: 10, alignItems: "flex-start", fontSize: 12, color: "#aaa", marginBottom: 10, lineHeight: 1.5 } as const,
  legalLinkBtn: { background: "none", border: "none", padding: 0, color: "#FFED00", textDecoration: "underline", cursor: "pointer", fontFamily: "inherit", fontSize: "inherit" } as const,
  error: { background: "#2a1414", border: "1px solid #5a2020", borderRadius: 6, padding: "8px 12px", fontSize: 12, color: "#e05252", marginTop: 10 } as const,
  // sticky/top globals.css `.cart-layout > aside` üzerinden gelir (mobilde otomatik kalkar)
  asideCard: { background: "#0c0c0c", border: "1px solid #1a1a1a", borderRadius: 12, padding: 20 },
  summaryRow: { display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, color: "#aaa", padding: "6px 0" } as const,
  itemRow: { display: "flex", justifyContent: "space-between", fontSize: 12, color: "#999", padding: "3px 0" } as const,
  bankBox: { background: "#111", border: "1px solid #1e1e1e", borderRadius: 8, padding: 14, fontSize: 12, color: "#aaa", lineHeight: 1.7, marginBottom: 12 } as const,
};

export default function CheckoutFlow({
  cart,
  addresses: initialAddresses,
  shippingMethods,
  defaultFullName,
  defaultPhone,
}: {
  cart: CartItem[];
  addresses: Address[];
  shippingMethods: ShippingMethod[];
  defaultFullName: string;
  defaultPhone: string;
}) {
  const cartCtx = useCart();
  // server'dan gelen cart başlangıç; sayfa içi adet değişiklikleri burada izlenmez (ödeme akışında dondurulmuş varsayılır).
  void cartCtx;

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [addresses, setAddresses] = useState<Address[]>(initialAddresses);
  const [shippingAddressId, setShippingAddressId] = useState<string | null>(
    initialAddresses.find((a) => a.is_default)?.id ?? initialAddresses[0]?.id ?? null,
  );
  const [sameBilling, setSameBilling] = useState(true);
  const [billingAddressId, setBillingAddressId] = useState<string | null>(null);

  const [shippingMethodId, setShippingMethodId] = useState<string | null>(shippingMethods[0]?.id ?? null);

  const [paymentMethod, setPaymentMethod] = useState<"credit_card" | "bank_transfer">("credit_card");
  const [agreedDistance, setAgreedDistance] = useState(false);
  const [agreedPreInfo, setAgreedPreInfo] = useState(false);

  const [showNewAddress, setShowNewAddress] = useState(initialAddresses.length === 0);
  const [savingAddress, setSavingAddress] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);

  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [openLegal, setOpenLegal] = useState<"distance" | "preinfo" | null>(null);

  async function handlePay() {
    if (!shippingAddressId || !shippingMethodId) return;
    setPayError(null);

    if (paymentMethod === "credit_card") {
      setPaying(true);
      const res = await initiateCardPayment({
        shippingAddressId,
        billingAddressId: sameBilling ? shippingAddressId : (billingAddressId ?? shippingAddressId),
        shippingMethodId,
      });
      if (!res.ok) {
        setPayError(res.error);
        setPaying(false);
        return;
      }
      window.location.href = res.paymentPageUrl;
      return;
    }

    // Havale/EFT
    setPaying(true);
    const res = await initiateBankTransfer({
      shippingAddressId,
      billingAddressId: sameBilling ? shippingAddressId : (billingAddressId ?? shippingAddressId),
      shippingMethodId,
    });
    if (!res.ok) {
      setPayError(res.error);
      setPaying(false);
      return;
    }
    window.location.href = `/odeme/basarili/${res.orderId}`;
  }

  const subtotal = useMemo(() => cart.reduce((s, i) => s + i.price * i.quantity, 0), [cart]);
  const selectedShipping = shippingMethods.find((m) => m.id === shippingMethodId) ?? null;
  const shippingCost =
    selectedShipping == null
      ? 0
      : selectedShipping.free_above != null && subtotal >= selectedShipping.free_above
      ? 0
      : selectedShipping.price;
  const total = subtotal + shippingCost;

  const shippingAddress = addresses.find((a) => a.id === shippingAddressId) ?? null;
  const billingAddress = sameBilling ? shippingAddress : addresses.find((a) => a.id === billingAddressId) ?? null;

  async function handleAddAddress(formData: FormData) {
    setSavingAddress(true);
    setAddressError(null);
    const res = await createAddress(formData);
    setSavingAddress(false);
    if (!res.ok) {
      setAddressError(res.error);
      return;
    }
    // Yeni adresi listeye ekle (server-side revalidate var; ama UI'ı hemen güncelliyoruz)
    const newAddr: Address = {
      id: res.addressId,
      title: String(formData.get("title") ?? ""),
      full_name: String(formData.get("full_name") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      full_address: String(formData.get("full_address") ?? ""),
      city: String(formData.get("city") ?? ""),
      district: String(formData.get("district") ?? ""),
      zip: (String(formData.get("zip") ?? "") || null) as string | null,
      is_default: false,
      is_billing: formData.get("is_billing") === "true",
    };
    setAddresses((prev) => [...prev, newAddr]);
    setShippingAddressId(newAddr.id);
    setShowNewAddress(false);
  }

  const canProceedPay = paymentMethod && agreedDistance && agreedPreInfo && shippingAddressId && shippingMethodId;

  return (
    <div className="cart-layout">
      <div style={s.steps}>
        {/* ───── Adım 1: Teslimat Adresi ───── */}
        {step === 1 ? (
          <div style={s.card}>
            <div style={s.stepTitle}>1. Teslimat Adresi</div>

            {addresses.length > 0 && !showNewAddress && (
              <>
                <div style={s.addressGrid}>
                  {addresses.map((a) => (
                    <div
                      key={a.id}
                      onClick={() => setShippingAddressId(a.id)}
                      style={s.addressCard(a.id === shippingAddressId)}
                    >
                      <div style={s.addrTitle}>{a.title}</div>
                      <div style={s.addrLine}>{a.full_name}</div>
                      <div style={s.addrLine}>{a.full_address}</div>
                      <div style={s.addrLine}>{a.district}, {a.city}{a.zip ? ` ${a.zip}` : ""}</div>
                      <div style={{ ...s.addrLine, marginTop: 4 }}>{a.phone}</div>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={() => setShowNewAddress(true)} style={s.newAddrBtn}>
                  + Yeni adres ekle
                </button>
              </>
            )}

            {showNewAddress && (
              <form action={handleAddAddress}>
                <div style={s.field}>
                  <label style={s.label}>Adres Başlığı</label>
                  <input style={s.input} name="title" placeholder="Ev / İş" required />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div style={s.field}>
                    <label style={s.label}>Ad Soyad</label>
                    <input style={s.input} name="full_name" defaultValue={defaultFullName} required />
                  </div>
                  <div style={s.field}>
                    <label style={s.label}>Telefon</label>
                    <input style={s.input} name="phone" defaultValue={defaultPhone} required />
                  </div>
                </div>
                <div style={s.field}>
                  <label style={s.label}>Açık Adres</label>
                  <textarea style={{ ...s.input, minHeight: 60, resize: "vertical" }} name="full_address" required />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                  <div style={s.field}>
                    <label style={s.label}>İl</label>
                    <input style={s.input} name="city" required />
                  </div>
                  <div style={s.field}>
                    <label style={s.label}>İlçe</label>
                    <input style={s.input} name="district" required />
                  </div>
                  <div style={s.field}>
                    <label style={s.label}>Posta Kodu</label>
                    <input style={s.input} name="zip" />
                  </div>
                </div>
                <input type="hidden" name="is_billing" value="false" />
                {addressError && <div style={s.error}>{addressError}</div>}
                <div style={{ marginTop: 12 }}>
                  {addresses.length > 0 && (
                    <button type="button" onClick={() => setShowNewAddress(false)} style={s.ghostBtn}>İptal</button>
                  )}
                  <button type="submit" disabled={savingAddress} style={s.primaryBtn(savingAddress)}>
                    {savingAddress ? "Kaydediliyor…" : "Adresi Kaydet"}
                  </button>
                </div>
              </form>
            )}

            {!showNewAddress && (
              <button
                type="button"
                disabled={!shippingAddressId}
                onClick={() => setStep(2)}
                style={s.primaryBtn(!shippingAddressId)}
              >
                Devam Et →
              </button>
            )}
          </div>
        ) : (
          <div style={s.cardDone}>
            <div>
              <div style={s.stepDoneTitle}>1. Teslimat Adresi</div>
              <div style={s.stepDoneValue}>
                {shippingAddress ? `${shippingAddress.title} — ${shippingAddress.district}, ${shippingAddress.city}` : "—"}
              </div>
            </div>
            <button type="button" onClick={() => setStep(1)} style={s.editBtn}>Düzenle</button>
          </div>
        )}

        {/* ───── Adım 2: Kargo Yöntemi ───── */}
        {step === 2 ? (
          <div style={s.card}>
            <div style={s.stepTitle}>2. Kargo Yöntemi</div>
            {shippingMethods.length === 0 ? (
              <div style={{ fontSize: 13, color: "#888" }}>Aktif kargo yöntemi bulunamadı.</div>
            ) : (
              shippingMethods.map((m) => {
                const free = m.free_above != null && subtotal >= m.free_above;
                return (
                  <div key={m.id} onClick={() => setShippingMethodId(m.id)} style={s.shippingRow(m.id === shippingMethodId)}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#e5e5e5" }}>{m.company}</div>
                      <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>
                        {m.name}{m.estimated_days ? ` • ${m.estimated_days}` : ""}
                        {m.free_above != null && !free && (
                          <> • {fmt(m.free_above - subtotal)} daha ekleyin, kargo ücretsiz</>
                        )}
                      </div>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: free ? "#52c07a" : "#e5e5e5" }}>
                      {free ? "Ücretsiz" : fmt(m.price)}
                    </div>
                  </div>
                );
              })
            )}
            <div style={{ marginTop: 10 }}>
              <button type="button" onClick={() => setStep(1)} style={s.ghostBtn}>← Geri</button>
              <button
                type="button"
                disabled={!shippingMethodId}
                onClick={() => setStep(3)}
                style={s.primaryBtn(!shippingMethodId)}
              >
                Devam Et →
              </button>
            </div>
          </div>
        ) : step > 2 ? (
          <div style={s.cardDone}>
            <div>
              <div style={s.stepDoneTitle}>2. Kargo Yöntemi</div>
              <div style={s.stepDoneValue}>
                {selectedShipping ? `${selectedShipping.company} — ${shippingCost === 0 ? "Ücretsiz" : fmt(shippingCost)}` : "—"}
              </div>
            </div>
            <button type="button" onClick={() => setStep(2)} style={s.editBtn}>Düzenle</button>
          </div>
        ) : null}

        {/* ───── Adım 3: Ödeme ───── */}
        {step === 3 && (
          <div style={s.card}>
            <div style={s.stepTitle}>3. Ödeme</div>
            <div style={s.payTabs}>
              <button
                type="button"
                onClick={() => setPaymentMethod("credit_card")}
                style={s.payTab(paymentMethod === "credit_card", true)}
              >
                Kredi/Banka Kartı
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("bank_transfer")}
                style={s.payTab(paymentMethod === "bank_transfer", false)}
              >
                Havale/EFT
              </button>
            </div>

            {paymentMethod === "credit_card" && (
              <div style={{ fontSize: 12, color: "#888", lineHeight: 1.6, marginBottom: 16 }}>
                İyzico güvenli ödeme sayfasına yönlendirileceksiniz. 3D Secure ile kartınız doğrulanır.
                Taksit seçenekleri kart bilgileri girildikten sonra görüntülenecek.
              </div>
            )}

            {paymentMethod === "bank_transfer" && (
              <div style={s.bankBox}>
                <div style={{ fontWeight: 600, color: "#e5e5e5", marginBottom: 6 }}>Banka Hesap Bilgileri</div>
                <div>Banka: <span style={{ color: "#e5e5e5" }}>[Banka Adı — TBD]</span></div>
                <div>IBAN: <span style={{ color: "#e5e5e5", fontFamily: "monospace" }}>TR00 0000 0000 0000 0000 0000 00</span></div>
                <div>Alıcı: <span style={{ color: "#e5e5e5" }}>auto-filter Ltd.</span></div>
                <div style={{ marginTop: 8, color: "#888" }}>
                  Açıklama alanına sipariş numaranızı yazmayı unutmayın. Ödemeniz onaylanınca siparişiniz hazırlanmaya başlar.
                </div>
              </div>
            )}

            <label style={s.checkRow}>
              <input type="checkbox" checked={agreedDistance} onChange={(e) => setAgreedDistance(e.target.checked)} />
              <span>
                <button type="button" onClick={() => setOpenLegal("distance")} style={s.legalLinkBtn}>
                  Mesafeli Satış Sözleşmesi
                </button>'ni okudum, onaylıyorum.
              </span>
            </label>
            <label style={s.checkRow}>
              <input type="checkbox" checked={agreedPreInfo} onChange={(e) => setAgreedPreInfo(e.target.checked)} />
              <span>
                <button type="button" onClick={() => setOpenLegal("preinfo")} style={s.legalLinkBtn}>
                  Ön Bilgilendirme Formu
                </button>'nu okudum, onaylıyorum.
              </span>
            </label>

            {payError && <div style={s.error}>{payError}</div>}
            <div style={{ marginTop: 8 }}>
              <button type="button" onClick={() => setStep(2)} style={s.ghostBtn} disabled={paying}>← Geri</button>
              <button
                type="button"
                disabled={!canProceedPay || paying}
                style={s.primaryBtn(!canProceedPay || paying)}
                onClick={handlePay}
              >
                {paying
                  ? "Yönlendiriliyor…"
                  : paymentMethod === "credit_card" ? "Ödemeye Geç →" : "Siparişi Onayla →"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ───── Özet ───── */}
      <aside style={s.asideCard}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, color: "#e5e5e5" }}>Sipariş Özeti</div>
        <div style={{ marginBottom: 12 }}>
          {cart.map((item) => (
            <div key={item.productId} style={s.itemRow}>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 200 }}>
                {item.productName} × {item.quantity}
              </span>
              <span>{fmt(item.price * item.quantity)}</span>
            </div>
          ))}
        </div>
        <div style={{ height: 1, background: "#1a1a1a", margin: "8px 0" }} />
        <div style={s.summaryRow}><span>Ara toplam</span><span>{fmt(subtotal)}</span></div>
        <div style={s.summaryRow}>
          <span>Kargo</span>
          <span>{selectedShipping ? (shippingCost === 0 ? "Ücretsiz" : fmt(shippingCost)) : <span style={{ color: "#666" }}>—</span>}</span>
        </div>
        <div style={{ height: 1, background: "#1a1a1a", margin: "8px 0" }} />
        <div style={s.summaryRow}>
          <span style={{ fontWeight: 700, color: "#e5e5e5" }}>Toplam</span>
          <span style={{ fontWeight: 700, color: "#e5e5e5", fontSize: 18 }}>{fmt(total)}</span>
        </div>
        {billingAddress && billingAddress.id !== shippingAddress?.id && (
          <div style={{ fontSize: 11, color: "#666", marginTop: 12 }}>
            Fatura adresi: {billingAddress.title}
          </div>
        )}
      </aside>

      <LegalModal
        open={openLegal === "distance"}
        title="Mesafeli Satış Sözleşmesi"
        onClose={() => setOpenLegal(null)}
      >
        <MesafeliSatisContent />
      </LegalModal>
      <LegalModal
        open={openLegal === "preinfo"}
        title="Ön Bilgilendirme Formu"
        onClose={() => setOpenLegal(null)}
      >
        <OnBilgilendirmeContent />
      </LegalModal>
    </div>
  );
}
