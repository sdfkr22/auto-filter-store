export default function Home() {
  return (
    <div style={{ minHeight: "100vh", background: "#090909", color: "#e5e5e5", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ textAlign: "center" }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>
          auto<span style={{ color: "#8fa4c0" }}>-filter</span>
        </h1>
        <p style={{ color: "#555", fontSize: 14 }}>Next.js kurulumu başarılı ✓</p>
      </div>
    </div>
  );
}
