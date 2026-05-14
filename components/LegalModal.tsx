"use client";

import { useEffect, type ReactNode } from "react";

export default function LegalModal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#0c0c0c",
          border: "1px solid #1a1a1a",
          borderRadius: 12,
          maxWidth: 760,
          width: "100%",
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px 22px",
            borderBottom: "1px solid #1a1a1a",
          }}
        >
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#fff", margin: 0 }}>{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Kapat"
            style={{
              background: "transparent",
              border: "none",
              color: "#888",
              fontSize: 24,
              cursor: "pointer",
              padding: 0,
              width: 32,
              height: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 6,
              fontFamily: "inherit",
            }}
          >
            ×
          </button>
        </div>
        <div
          style={{
            padding: "20px 26px 24px",
            overflowY: "auto",
            fontSize: 14,
            color: "#ccc",
            lineHeight: 1.75,
          }}
        >
          {children}
        </div>
        <div
          style={{
            padding: "12px 22px",
            borderTop: "1px solid #1a1a1a",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "#FFED00",
              color: "#0a0a0a",
              border: "none",
              borderRadius: 6,
              padding: "9px 18px",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}
