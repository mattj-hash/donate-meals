export default function Home() {
  return (
    <main style={{ fontFamily: "sans-serif", maxWidth: 600, margin: "80px auto", padding: "0 24px" }}>
      <h1 style={{ fontSize: 36, fontWeight: 700 }}>Donate Meals</h1>
      <p style={{ fontSize: 18, color: "#555", marginTop: 12 }}>
        Help Rethink Food provide nutritious meals to communities in need.
      </p>
      <a
        href="#donate"
        style={{
          display: "inline-block",
          marginTop: 32,
          padding: "14px 32px",
          background: "#1a1a1a",
          color: "#fff",
          borderRadius: 8,
          textDecoration: "none",
          fontWeight: 600,
          fontSize: 16,
        }}
      >
        Donate Now
      </a>
    </main>
  );
}
