"use client";

export default function BackButton() {
  return (
    <button
      type="button"
      onClick={() => history.back()}
      style={{
        fontSize: 12, color: "#aaa", background: "transparent",
        border: "1px solid #2a2a2a", borderRadius: 6,
        padding: "4px 12px", cursor: "pointer", fontFamily: "inherit",
      }}
    >
      ← Geri Dön
    </button>
  );
}
