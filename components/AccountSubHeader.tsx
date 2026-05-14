import Link from "next/link";

// /hesabim alt sayfalarında ana header'ın altına gelen geri/breadcrumb şeridi.
export default function AccountSubHeader({
  trail,
}: {
  // [{ href: "/hesabim", label: "Hesabım" }, { label: "Profilim" }] gibi.
  // Son eleman link'siz, geçerli sayfa (href verilmese de olur).
  trail: { href?: string; label: string }[];
}) {
  const backHref = trail.length >= 2 ? trail[trail.length - 2].href : trail[0]?.href;

  return (
    <div
      style={{
        borderBottom: "1px solid #1a1a1a",
        padding: "12px 28px",
        display: "flex",
        alignItems: "center",
        gap: 14,
        background: "#0a0a0a",
      }}
    >
      {backHref && (
        <Link
          href={backHref}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 13,
            color: "#aaa",
            textDecoration: "none",
            padding: "5px 10px",
            border: "1px solid #2a2a2a",
            borderRadius: 6,
          }}
        >
          ← Geri
        </Link>
      )}
      <nav style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", fontSize: 13, color: "#666" }}>
        {trail.map((t, idx) => {
          const last = idx === trail.length - 1;
          return (
            <span key={idx} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              {t.href && !last ? (
                <Link href={t.href} style={{ color: "#888", textDecoration: "none" }}>
                  {t.label}
                </Link>
              ) : (
                <span style={{ color: "#e5e5e5" }}>{t.label}</span>
              )}
              {!last && <span style={{ color: "#333" }}>/</span>}
            </span>
          );
        })}
      </nav>
    </div>
  );
}
