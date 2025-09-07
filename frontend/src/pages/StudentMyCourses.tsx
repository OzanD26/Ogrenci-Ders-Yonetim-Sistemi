import { useEffect, useState } from "react";
import client from "../api/client";

/* ---------- Types ---------- */
type Course = { id: number; name: string };

export default function StudentMyCourses() {
  const [items, setItems] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true); setErr("");
    try {
      const res = await client.get<{ items: Course[] }>("/me/courses");
      setItems(res.data.items);
    } catch (e: any) {
      setErr(e?.response?.data?.message ?? e?.message ?? "Dersler yüklenemedi");
    } finally { setLoading(false); }
  }

  async function drop(id: number) {
    if (!confirm("Bu dersi bırakmak istiyor musun?")) return;
    setErr("");
    try {
      await client.delete(`/me/enroll/${id}`);
      await load();
    } catch (e: any) {
      setErr(e?.response?.data?.message ?? e?.message ?? "Ders bırakma işlemi başarısız oldu");
    }
  }

  const isEmpty = !loading && items.length === 0;

  return (
    <section style={sx.section}>
      <header style={sx.header}>
        <h2 style={sx.title}>
          <span style={sx.dot} aria-hidden="true" /> Derslerim
        </h2>
        <span style={sx.totalPill}>Toplam: {items.length}</span>
      </header>

      {err && <div style={sx.errorBanner}><WarnIcon /> <span>{err}</span></div>}

      {/* Skeleton */}
      {loading && (
        <ul style={sx.grid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <li key={i} style={sx.skeletonCard} />
          ))}
        </ul>
      )}

      {/* Empty */}
      {isEmpty && (
        <article style={sx.empty}>
          <div style={sx.emptyBadge}>Kayıt yok</div>
          <h3 style={sx.emptyTitle}>Henüz herhangi bir derse katılmadın.</h3>
          <p style={sx.emptyText}>
            <strong>Kayıt</strong> sayfasına gidip ders seçebilirsin.
          </p>
        </article>
      )}

      {/* List */}
      {!loading && !isEmpty && (
        <ul style={sx.grid}>
          {items.map((c) => (
            <li key={c.id} style={sx.card}>
              <div style={sx.avatar}><span style={{ fontWeight: 800 }}>{initials(c.name)}</span></div>

              <div style={sx.cardBody}>
                <div style={sx.cardTop}>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <strong style={sx.name}>{c.name}</strong>
                    <span style={sx.idPill}>No #{c.id}</span>
                  </div>

                  <button
                    onClick={() => drop(c.id)}
                    style={sx.iconBtnDanger}
                    title="Dersi bırak"
                  >
                    <TrashIcon />
                  </button>
                </div>

                <div style={sx.metaRow}>
                  <BookIcon />
                  <span>Kayıtlı ders</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}



/* ---------- Helpers ---------- */
function initials(name: string) {
  return name
    .split(" ")
    .map((x) => x[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/* ---------- Styles ---------- */
const sx: Record<string, React.CSSProperties> = {
  section: {
    color: "#111418",
    background: "linear-gradient(180deg, rgba(245,247,250,.8), rgba(255,255,255,.9))",
    padding: 16,
  },
  header: {
    display: "grid",
    gridTemplateColumns: "1fr auto",
    alignItems: "end",
    gap: 12,
    marginBottom: 12,
  },
  title: { display: "flex", alignItems: "center", gap: 10, margin: 0, fontSize: 24 },
  dot: {
    width: 10, height: 10, borderRadius: 999, background: "#6a7cff",
    boxShadow: "0 0 0 6px rgba(106,124,255,0.18)", display: "inline-block",
  },
  totalPill: {
    alignSelf: "center", fontSize: 13, padding: "6px 10px", borderRadius: 999,
    border: "1px solid #e5e7eb", background: "#fff", color: "#111418",
  },

  errorBanner: {
    display: "flex", alignItems: "center", gap: 8,
    border: "1px solid #fca5a5", background: "#fff1f2", color: "#b91c1c",
    padding: "8px 10px", borderRadius: 12, marginBottom: 12,
  },

  grid: {
    listStyle: "none", padding: 0, margin: 0,
    display: "grid", gap: 12,
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
  },

  card: {
    display: "grid", gridTemplateColumns: "56px 1fr", gap: 12,
    padding: 14, background: "#fff", border: "1px solid #e5e7eb",
    borderRadius: 16,
    boxShadow: "0 1px 0 rgba(0,0,0,0.06), 0 8px 26px -18px rgba(0,0,0,0.35)",
  },
  avatar: {
    width: 56, height: 56, borderRadius: 14, display: "grid", placeItems: "center",
    background: "linear-gradient(135deg, rgba(106,124,255,0.22), #fff)",
    border: "1px solid #e5e7eb", color: "#0f172a",
  },
  cardBody: { display: "grid", gap: 8 },
  cardTop: { display: "grid", gridTemplateColumns: "1fr auto", alignItems: "start", gap: 8 },
  name: { fontSize: 16, letterSpacing: 0.2 },
  idPill: {
    fontSize: 12, fontWeight: 600, color: "#64748b",
    border: "1px solid #e5e7eb", borderRadius: 6, padding: "1px 6px",
  },
  metaRow: { display: "inline-flex", alignItems: "center", gap: 8, color: "#6b7280", fontSize: 13 },

  iconBtnDanger: {
    border: "1px solid rgba(220,38,38,0.35)", background: "transparent",
    borderRadius: 12, width: 36, height: 36, display: "grid", placeItems: "center",
    cursor: "pointer", color: "#b91c1c",
  },

  /* states */
  skeletonCard: {
    height: 104, borderRadius: 16, border: "1px solid #e5e7eb",
    background: "linear-gradient(90deg, #f5f5f7 0%, #ececf0 50%, #f5f5f7 100%)",
    backgroundSize: "200% 100%", animation: "shimmer 1.2s linear infinite",
  },
  empty: {
    textAlign: "center", padding: "28px 12px",
    border: "1px dashed #e5e7eb", borderRadius: 16, background: "#fff",
  },
  emptyBadge: {
    display: "inline-block", padding: "4px 10px", borderRadius: 999,
    border: "1px solid #e5e7eb", background: "#fff", color: "#374151", fontSize: 12, marginBottom: 8,
  },
  emptyTitle: { margin: "4px 0 6px", fontSize: 18 },
  emptyText: { margin: 0, color: "#6b7280" },
};

/* ---------- Icons ---------- */
function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" aria-hidden="true">
      <path fill="currentColor" d="M6 7h2v9H6V7zm6 0h2v9h-2V7zM4 5h12v2H4V5zm2-2h8v2H6V3zm-1 4h10l-1 11H6L5 7z"/>
    </svg>
  );
}
function BookIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M6 2h11a3 3 0 0 1 3 3v15a2 2 0 0 1-2 2H6a3 3 0 0 1-3-3V5a3 3 0 0 1 3-3zm1 4h12v12H7V6z"/>
    </svg>
  );
}
function WarnIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" aria-hidden="true">
      <path fill="currentColor" d="M10 2l9 16H1L10 2zm-1 6h2v4H9V8zm0 6h2v2H9v-2z"/>
    </svg>
  );
}

/* 
Global CSS’e (örn. App.css) ekleyebileceğin shimmer animasyonu:
@keyframes shimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }
*/
