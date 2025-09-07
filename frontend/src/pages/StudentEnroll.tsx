import { useEffect, useState } from "react";
import client from "../api/client";

/* ---------- Types ---------- */
type Course = { id: number; name: string };
type Paged<T> = { items: T[]; total: number; page: number; pageSize: number };

export default function StudentEnroll() {
  const [all, setAll] = useState<Course[]>([]);
  const [mine, setMine] = useState<Course[]>([]);
  const [courseId, setCourseId] = useState<number | "">("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  useEffect(() => {
    Promise.all([loadAll(), loadMine()]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadAll() {
    try {
      const res = await client.get<Paged<Course>>("/courses?page=1&pageSize=1000");
      setAll(res.data.items);
    } catch {/* sessiz */}
  }

  async function loadMine() {
    setLoading(true); setErr(""); setOk("");
    try {
      const res = await client.get<{ items: Course[] }>("/me/courses");
      setMine(res.data.items);
    } catch (e: any) {
      setErr(e?.response?.data?.message ?? e?.message ?? "Yüklenemedi");
    } finally {
      setLoading(false);
    }
  }

  const enrolled = new Set(mine.map(x => x.id));
  const available = all.filter(x => !enrolled.has(x.id));

  async function enroll(targetId?: number) {
    const idToUse = typeof targetId === "number" ? targetId : (courseId ? Number(courseId) : undefined);
    if (!idToUse) return;

    setErr(""); setOk("");
    try {
      await client.post("/me/enroll", { courseId: idToUse });
      setCourseId("");
      await loadMine();
      setOk("Kayıt tamamlandı.");
    } catch (e: any) {
      const m = e?.response?.status === 409
        ? "Bu derse zaten kayıtlısın."
        : e?.response?.data?.message ?? e?.message ?? "Kayıt başarısız oldu";
      setErr(m);
    }
  }

  const isEmptyAvail = !loading && available.length === 0;

  return (
    <section style={sx.section}>
      <header style={sx.header}>
        <div>
          <h2 style={sx.title}>
            <span style={sx.dot} aria-hidden="true" /> Yeni Derse Kayıt
          </h2>
          <p style={sx.subtitle}>Listeden yeni bir ders seç ya da Hızlı Kayıt ızgarasını kullan.</p>
        </div>
        <div style={{ display: "inline-flex", gap: 8 }}>
          <span style={sx.totalPill}>Kayıtlı: {mine.length}</span>
          <span style={sx.totalPill}>Uygun: {available.length}</span>
        </div>
      </header>

      {err && <div style={sx.errorBanner}><WarnIcon /> <span>{err}</span></div>}
      {ok &&  <div style={sx.okBanner}><CheckIcon /> <span>{ok}</span></div>}

      {/* Select + Enroll */}
      <div style={sx.addCard}>
        <label style={sx.label}>
          <span>Uygun dersler</span>
          <select
            value={courseId}
            onChange={(e) => setCourseId(e.target.value ? Number(e.target.value) : "")}
            style={sx.select}
          >
            <option value="">Bir ders seçin</option>
            {available.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <button onClick={() => enroll()} style={sx.primaryBtn} disabled={!courseId}>
          <PlusIcon /> <span>Kaydol</span>
        </button>
      </div>

      {/* Quick Enroll Grid */}
      <h3 style={sx.h3}>Hızlı Kayıt</h3>

      {loading && (
        <ul style={sx.grid}>
          {Array.from({ length: 6 }).map((_, i) => <li key={i} style={sx.skeletonCard} />)}
        </ul>
      )}

      {!loading && isEmptyAvail && (
        <article style={sx.empty}>
          <div style={sx.emptyBadge}>Uygun ders yok</div>
          <p style={{ margin: 0, color: "#6b7280" }}>Tüm derslere zaten kayıtlısın.</p>
        </article>
      )}

      {!loading && !isEmptyAvail && (
        <ul style={sx.grid}>
          {available.map(c => (
            <li key={c.id} style={sx.card}>
              <div style={sx.avatar}>
                <span style={{ fontWeight: 800 }}>{initials(c.name)}</span>
              </div>

              <div style={sx.cardBody}>
                <div style={sx.cardTop}>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <strong style={sx.name}>{c.name}</strong>
                    <span style={sx.idPill}>No #{c.id}</span>
                  </div>

                  <button onClick={() => enroll(c.id)} style={sx.iconBtn} title="Kaydol">
                    <PlusIcon />
                  </button>
                </div>

                <div style={sx.metaRow}>
                  <BookIcon />
                  <span>Kayıt için +’ya tıkla</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Enrolled list (chips) */}
      <h3 style={sx.h3}>Zaten Kayıtlı</h3>
      {loading ? (
        <div style={sx.skeletonShort} />
      ) : (
        <ul style={sx.pills}>
          {mine.map(c => <li key={c.id} style={sx.pill}>{c.name}</li>)}
          {mine.length === 0 && <li style={{ color: "#6b7280" }}>Henüz kayıt yok.</li>}
        </ul>
      )}
    </section>
  );
}




/* ---------- Helpers ---------- */
function initials(name: string) {
  return name
    .split(" ")
    .map(x => x[0])
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
    display: "grid",
    gap: 12,
  },
  header: {
    display: "grid",
    gridTemplateColumns: "1fr auto",
    gap: 12,
    alignItems: "end",
    marginBottom: 4,
  },
  title: { display: "flex", alignItems: "center", gap: 10, margin: 0, fontSize: 24 },
  dot: {
    width: 10, height: 10, borderRadius: 999, background: "#6a7cff",
    boxShadow: "0 0 0 6px rgba(106,124,255,0.18)", display: "inline-block",
  },
  subtitle: { margin: "6px 0 0", color: "#4b5563", fontSize: 14 },
  totalPill: {
    alignSelf: "center", fontSize: 13, padding: "6px 10px", borderRadius: 999,
    border: "1px solid #e5e7eb", background: "#fff", color: "#111418",
  },

  errorBanner: {
    display: "flex", alignItems: "center", gap: 8,
    border: "1px solid #fca5a5", background: "#fff1f2", color: "#b91c1c",
    padding: "8px 10px", borderRadius: 12,
  },
  okBanner: {
    display: "flex", alignItems: "center", gap: 8,
    border: "1px solid #86efac", background: "#ecfdf5", color: "#166534",
    padding: "8px 10px", borderRadius: 12,
  },

  addCard: {
    display: "grid",
    gridTemplateColumns: "1fr auto",
    gap: 10,
    padding: 12,
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    background: "#fff",
    boxShadow: "0 1px 0 rgba(0,0,0,0.04), 0 16px 28px -22px rgba(0,0,0,0.15)",
  },
  label: { display: "grid", gap: 6, fontSize: 14 },
  select: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    background: "#fff",
    outline: "none",
  },
  primaryBtn: {
    alignSelf: "end",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 14px",
    borderRadius: 12,
    border: "1px solid #6a7cff",
    background: "linear-gradient(180deg, rgba(106,124,255,.14), rgba(255,255,255,1))",
    color: "#0f172a",
    cursor: "pointer",
    boxShadow: "0 2px 0 rgba(106,124,255,0.25), 0 12px 24px -10px rgba(106,124,255,0.35)",
  },

  h3: { margin: "12px 0 6px" },

  grid: {
    listStyle: "none",
    padding: 0,
    margin: 0,
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: 12,
  },
  card: {
    display: "grid",
    gridTemplateColumns: "56px 1fr",
    gap: 12,
    padding: 14,
    background: "#fff",
    border: "1px solid #e5e7eb",
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

  iconBtn: {
    border: "1px solid #c7d2fe",
    background: "transparent",
    borderRadius: 12,
    width: 36, height: 36,
    display: "grid", placeItems: "center",
    cursor: "pointer", color: "#4338ca",
  },

  skeletonCard: {
    height: 104,
    borderRadius: 16,
    border: "1px solid #e5e7eb",
    background: "linear-gradient(90deg, #f5f5f7 0%, #ececf0 50%, #f5f5f7 100%)",
    backgroundSize: "200% 100%",
    animation: "shimmer 1.2s linear infinite",
  },
  skeletonShort: {
    height: 70,
    borderRadius: 16,
    border: "1px solid #e5e7eb",
    background: "#f2f3f7",
  },

  pills: {
    listStyle: "none",
    padding: 0,
    margin: 0,
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },
  pill: {
    border: "1px solid #e5e7eb",
    borderRadius: 999,
    padding: "6px 10px",
    background: "#fff",
  },

  empty: {
    textAlign: "center",
    padding: "24px 12px",
    border: "1px dashed #e5e7eb",
    borderRadius: 16,
    background: "#fff",
  },
  emptyBadge: {
    display: "inline-block",
    padding: "4px 10px",
    borderRadius: 999,
    border: "1px solid #e5e7eb",
    background: "#fff",
    color: "#374151",
    fontSize: 12,
    marginBottom: 6,
  },
};

/* ---------- Icons ---------- */
function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" role="img" aria-label="add">
      <path d="M7 1h2v14H7zM1 7h14v2H1z" fill="currentColor" />
    </svg>
  );
}
function BookIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M6 2h11a3 3 0 0 1 3 3v15a2 2 0 0 1-2 2H6a3 3 0 0 1-3-3V5a3 3 0 0 1 3-3zm1 4h12v12H7V6z" />
    </svg>
  );
}
function WarnIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" aria-hidden="true">
      <path fill="currentColor" d="M10 2l9 16H1L10 2zm-1 6h2v4H9V8zm0 6h2v2H9v-2z" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" aria-hidden="true">
      <path fill="currentColor" d="M7.5 13.5l-3-3L3 12l4.5 4.5L17 7l-1.5-1.5L7.5 13.5z" />
    </svg>
  );
}

/* 
Global CSS’te yoksa, shimmer için:
@keyframes shimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }
*/
