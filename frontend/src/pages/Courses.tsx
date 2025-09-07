import { useEffect, useMemo, useState } from "react";
import client from "../api/client";
import { Pagination } from "../components/Pagination";

/* ---------- Types ---------- */
type StudentLite = { id: number; firstName: string; lastName: string };
type Course = {
  id: number;
  name: string;
  // backend liste uç noktası enrollments gönderiyorsa otomatik kullanırız:
  enrollments?: { id: number; student: StudentLite }[];
};
type Paged<T> = { items: T[]; total: number; page: number; pageSize: number };

type CourseDetail = {
  id: number;
  name: string;
  enrollments?: { id: number; student: StudentLite }[];
};

export default function Courses() {
  /* list */
  const [data, setData] = useState<Paged<Course>>({
    items: [],
    total: 0,
    page: 1,
    pageSize: 10,
  });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  /* search */
  const [q, setQ] = useState("");

  /* add modal */
  const [addOpen, setAddOpen] = useState(false);
  const [addSaving, setAddSaving] = useState(false);
  const [addErr, setAddErr] = useState("");
  const [courseName, setCourseName] = useState("");

  /* detail modal */
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailErr, setDetailErr] = useState("");
  const [detail, setDetail] = useState<CourseDetail | null>(null);

  /* list row -> enrolled names map (cache) */
  const [enrolledMap, setEnrolledMap] = useState<Record<number, StudentLite[]>>({});

  /* load list */
  async function load(p: number) {
    setLoading(true);
    setErr("");
    try {
      const res = await client.get<Paged<Course>>(`/courses?page=${p}&pageSize=${data.pageSize}`);
      setData(res.data);
      // varsa listede enrollments alanı, map'i direkt doldur
      const pre: Record<number, StudentLite[]> = {};
      for (const c of res.data.items) {
        if (c.enrollments?.length) pre[c.id] = c.enrollments.map((e) => e.student);
      }
      if (Object.keys(pre).length) setEnrolledMap((m) => ({ ...m, ...pre }));

      // yoksa görünür dersler için paralel detay çekip cache'le
      const needFetchIds = res.data.items
        .filter((c) => !(c.id in pre) && !(c.id in enrolledMap))
        .map((c) => c.id);

      if (needFetchIds.length) {
        const details = await Promise.all(
          needFetchIds.map((id) =>
            client
              .get<CourseDetail>(`/courses/${id}`)
              .then((r) => [id, r.data] as const)
              .catch(() => [id, null] as const)
          )
        );
        const merged: Record<number, StudentLite[]> = {};
        for (const [id, d] of details) {
          if (d?.enrollments) merged[id] = d.enrollments.map((e) => e.student);
        }
        if (Object.keys(merged).length) setEnrolledMap((m) => ({ ...m, ...merged }));
      }
    } catch (e: any) {
      setErr(e?.response?.data?.message ?? e?.message ?? "Dersler yüklenemedi");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* filtered list */
  const items = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return data.items;
    return data.items.filter((c) => c.name.toLowerCase().includes(s) || String(c.id).includes(s));
  }, [q, data.items]);

  /* add modal logic */
  function openAdd() {
    setCourseName("");
    setAddErr("");
    setAddOpen(true);
  }
  function closeAdd() {
    setAddOpen(false);
    setAddSaving(false);
    setAddErr("");
  }
  async function addCourse(e: React.FormEvent) {
    e.preventDefault();
    const nm = courseName.trim();
    if (!nm) return setAddErr("Ad zorunludur.");
    setAddSaving(true);
    try {
      await client.post("/courses", { name: nm });
      closeAdd();
      await load(1);
    } catch (e: any) {
      setAddErr(e?.response?.data?.message ?? e?.message ?? "Ders ekleme başarısız oldu");
      setAddSaving(false);
    }
  }

  /* delete */
  async function removeCourse(id: number) {
    if (!confirm("Bu dersi silmek istiyor musunuz?")) return;
    try {
      await client.delete(`/courses/${id}`);
      await load(data.page);
    } catch (e: any) {
      alert(e?.response?.data?.message ?? e?.message ?? "Ders silme başarısız oldu");
    }
  }

  /* detail */
  async function openDetail(courseId: number) {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetailErr("");
    setDetail(null);
    try {
      const res = await client.get<CourseDetail>(`/courses/${courseId}`);
      setDetail(res.data);
    } catch (e: any) {
      setDetailErr(e?.response?.data?.message ?? e?.message ?? "Detay yüklenemedi");
    } finally {
      setDetailLoading(false);
    }
  }
  function closeDetail() {
    setDetailOpen(false);
    setDetail(null);
  }

  return (
    <section className="as-wrap">
      <style>{css}</style>

      {/* header */}
      <header className="as-header">
        <div>
          <h1>Ders Yönetimi</h1>
          <p>Dersleri ara, ekle ve yönet. Kayıtlı öğrencileri görmek için bir derse tıkla.</p>
          <small className="as-muted">Toplam: {data.total}</small>
        </div>
        <button className="as-add" onClick={openAdd}><span>＋</span> Yeni Ders Ekle</button>
      </header>

      {/* search */}
      <div className="as-search">
        <span className="as-search-ic">🔎</span>
        <input
          placeholder="Dersleri ada veya numaraya göre ara…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {err && <div className="as-error">{err}</div>}

      {/* table */}
      {loading ? (
        <div className="as-skel" />
      ) : (
        <div className="as-table">
          <div className="as-thead">
            <div>Ders</div>
            <div className="hide-sm">Ders No</div>
            <div>Kayıtlı</div>
            <div className="as-right">İşlemler</div>
          </div>

          <div className="as-tbody">
            {items.map((c) => {
              const students = enrolledMap[c.id] ?? c.enrollments?.map((e) => e.student) ?? [];
              return (
                <div className="as-row" key={c.id}>
                  {/* course name → open detail */}
                  <button className="as-name as-linklike" onClick={() => openDetail(c.id)} title="Detayı göster">
                    <div className="as-avatar">{initials(c.name)}</div>
                    <div className="as-col">
                      <div className="as-strong">{c.name}</div>
                      <div className="as-muted show-sm">ID CRS{String(c.id).padStart(5, "0")}</div>
                    </div>
                  </button>

                  <div className="hide-sm">CRS{String(c.id).padStart(5, "0")}</div>

                  {/* Enrolled names (kısa özet) */}
                  <div title={students.map(fullName).join(", ") || "—"}>
                    {students.length ? summarizeNames(students) : "—"}
                  </div>

                  <div className="as-right as-actions">
                    <button className="as-icon danger" title="Sil" onClick={() => removeCourse(c.id)}>🗑️</button>
                  </div>
                </div>
              );
            })}
            {!items.length && <div className="as-empty">Hiç ders bulunamadı.</div>}
          </div>
        </div>
      )}

      {/* pagination */}
      <footer style={{ display: "flex", justifyContent: "flex-end" }}>
        <Pagination
          page={data.page}
          pageSize={data.pageSize}
          total={data.total}
          onChange={(p) => load(p)}
        />
      </footer>

      {/* ADD MODAL */}
      {addOpen && (
        <dialog open className="as-dialog" onClose={closeAdd}>
          <article className="as-modal">
            <header>
              <strong>Ders Ekle</strong>
              <button type="button" className="as-close" onClick={closeAdd}>Kapat</button>
            </header>

            <form className="as-form" onSubmit={addCourse}>
              <label>Ders adı
                <input
                  autoFocus
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  placeholder="örn. Veri Yapıları"
                />
              </label>
              {addErr && <div className="as-error">{addErr}</div>}
              <div className="as-form-actions">
                <button type="button" className="btn-secondary" onClick={closeAdd} disabled={addSaving}>İptal</button>
                <button type="submit" aria-busy={addSaving}>Oluştur</button>
              </div>
            </form>
          </article>
        </dialog>
      )}

      {/* DETAIL MODAL */}
      {detailOpen && (
        <dialog open className="as-dialog" onClose={closeDetail}>
          <article className="as-modal">
            <header>
              <strong>Ders Detayı</strong>
              <button type="button" className="as-close" onClick={closeDetail}>Kapat</button>
            </header>

            {detailLoading && <progress />}
            {detailErr && <div className="as-error">{detailErr}</div>}

            {detail && (
              <div className="as-detail">
                <div className="as-detail-header">
                  <div className="as-avatar lg">{initials(detail.name)}</div>
                  <div>
                    <div className="as-strong" style={{ fontSize: 16 }}>{detail.name}</div>
                    <div className="as-muted">ID CRS{String(detail.id).padStart(5, "0")}</div>
                  </div>
                </div>

                <div className="divider" />

                <div>
                  <h4 className="as-subtitle">Kayıtlı Öğrenciler</h4>
                  <ul className="as-chip-list">
                    {(detail.enrollments ?? []).map((e) => (
                      <li className="chip" key={e.id}>
                        {fullName(e.student)}
                        <span className="as-muted" style={{ marginLeft: 8 }}>#{e.student.id}</span>
                      </li>
                    ))}
                    {(!detail.enrollments || detail.enrollments.length === 0) && (
                      <li className="as-muted">Kayıtlı öğrenci bulunmamaktadır.</li>
                    )}
                  </ul>
                </div>
              </div>
            )}
          </article>
        </dialog>
      )}
    </section>
  );
}


/* -------- Helpers -------- */
function initials(name: string) {
  const [a = "", b = ""] = name.trim().split(/\s+/);
  return (a[0] ?? "C").toUpperCase() + (b[0]?.toUpperCase() ?? "");
}
function fullName(s: { firstName: string; lastName: string }) {
  return `${s.firstName} ${s.lastName}`;
}
function summarizeNames(arr: { firstName: string; lastName: string }[]) {
  if (arr.length <= 2) return arr.map(fullName).join(", ");
  const firstTwo = arr.slice(0, 2).map(fullName).join(", ");
  return `${firstTwo} +${arr.length - 2} more`;
}

/* ---------- CSS (Students ile aynı tema) ---------- */
const css = `
:root{
  --bg:#0d1016; --panel:#10161e; --ink:#e9edf4; --muted:#95a0b1;
  --line:#1b2433; --accent:#22c55e; --accent-700:#16a34a; --focus: rgba(34,197,94,.18);
}
.as-wrap{ color:var(--ink); display:grid; gap:16px; }

/* header */
.as-header{ display:flex; justify-content:space-between; align-items:flex-end; gap:12px; padding:6px 2px; }
.as-header h1{ margin:0; font-size:28px; font-weight:800; }
.as-header p{ margin:6px 0 0; color:var(--muted); }
.as-add{
  display:inline-flex; align-items:center; gap:10px;
  background:linear-gradient(180deg, var(--accent), var(--accent-700));
  color:#062b14; border:0; border-radius:12px; padding:10px 14px;
  font-weight:800; cursor:pointer; box-shadow:0 10px 24px rgba(34,197,94,.25), inset 0 -2px 0 rgba(0,0,0,.25);
}
.as-add span{ font-size:18px; line-height:14px; }

/* search */
.as-search{ position:relative; background:#0f151c; border:1px solid var(--line); border-radius:12px; padding:2px 12px 2px 36px; }
.as-search input{ width:100%; background:transparent; border:0; outline:none; color:var(--ink); padding:10px 0; font-size:14px; }
.as-search-ic{ position:absolute; left:10px; top:50%; transform:translateY(-50%); opacity:.7; }

/* table */
.as-table{
  background:linear-gradient(180deg, var(--panel), #0e141b);
  border:1px solid var(--line); border-radius:14px;
  box-shadow:0 16px 40px rgba(0,0,0,.45); overflow:hidden;
}
.as-thead{
  display:grid; grid-template-columns: 2.2fr 1fr 1.4fr auto;
  gap:12px; padding:12px 14px; border-bottom:1px solid var(--line);
  color:#cfe6d8; background:#0e141b; font-weight:700; font-size:13px;
}
.as-tbody{ display:grid; }
.as-row{
  display:grid; grid-template-columns: 2.2fr 1fr 1.4fr auto;
  gap:12px; padding:12px 14px; border-top:1px solid #131a23; background:#0f151c;
}
.as-row:nth-child(even){ background:#101821; }

/* row content */
.as-name{ display:flex; gap:12px; align-items:center; }
.as-linklike{ all:unset; display:flex; gap:12px; align-items:center; cursor:pointer; }
.as-linklike:hover .as-strong{ text-decoration: underline; }
.as-avatar{
  width:36px; height:36px; border-radius:10px; display:grid; place-items:center;
  background:#0c1218; border:1px solid #23312a; font-weight:800;
}
.as-avatar.lg{ width:44px; height:44px; border-radius:12px; }
.as-col{ display:grid; }
.as-strong{ font-weight:800; }
.as-muted{ color:var(--muted); font-size:12px; }

/* actions */
.as-right{ justify-self:end; }
.as-actions{ display:flex; gap:8px; }
.as-icon{
  background:#0c1218; color:#cfe6d8; border:1px solid #24322a;
  border-radius:10px; padding:8px 10px; cursor:pointer;
}
.as-icon.danger{ border-color:#3a2225; color:#ffd4d4; }
.as-icon.danger:hover{ box-shadow:0 0 0 4px rgba(239,68,68,.18); }

/* states */
.as-empty{ padding:28px; text-align:center; color:var(--muted); }
.as-error{ border:1px solid #6b1f26; background:#2a1518; color:#ffb8b8; padding:10px 12px; border-radius:12px; font-size:14px; }
.as-skel{
  height:240px; border:1px solid var(--line); border-radius:14px;
  background:linear-gradient(90deg,#0f151c, #121b26, #0f151c);
  background-size:200% 100%; animation: as-shimmer 1.2s infinite linear;
}
@keyframes as-shimmer{ to { background-position:-200% 0; } }

/* dialog (popups) */
.as-dialog[open]{ position:fixed; inset:0; display:grid; place-items:center; padding:0; border:none; background:transparent; z-index:60; }
.as-dialog::backdrop{ background:rgba(2,6,23,.55); backdrop-filter:blur(2px); }
.as-modal{
  width:min(560px,92vw); background:#0e141b; color:var(--ink);
  border:1px solid var(--line); border-radius:16px; padding:16px;
  box-shadow:0 18px 50px rgba(0,0,0,.45); display:grid; gap:12px;
}
.as-modal header{ display:flex; align-items:center; gap:8px; }
.as-close{
  margin-left:auto; background:#0c1218; color:#cfe6d8;
  border:1px solid #24322a; border-radius:10px; padding:8px 10px; cursor:pointer;
}
.as-form{ display:grid; gap:10px; }
.as-form label{ display:grid; gap:6px; font-size:14px; }
.as-form input{
  background:#0c1118; color:var(--ink);
  border:1px solid var(--line); border-radius:10px; padding:10px 12px;
}
.as-form input:focus{ border-color:#274536; box-shadow:0 0 0 4px var(--focus); }
.as-form-actions{ display:grid; grid-template-columns:1fr 1fr; gap:8px; }

/* detail extras */
.as-detail{ display:grid; gap:12px; }
.as-detail-header{ display:flex; gap:12px; align-items:center; }
.divider{ height:1px; background:#1b2433; border-radius:1px; }
.as-subtitle{ margin:0 0 6px; font-weight:800; font-size:14px; }
.as-chip-list{ list-style:none; padding:0; margin:0; display:flex; flex-wrap:wrap; gap:8px; }
.chip{
  padding:6px 10px; border:1px solid #24322a; background:#0c1218;
  border-radius:999px; font-size:12px; color:#cfe6d8;
}

/* responsive */
.hide-sm{ display:block; }
.show-sm{ display:none; }
@media (max-width: 880px){
  .as-thead, .as-row{ grid-template-columns: 2.2fr .9fr auto; }
  .hide-sm{ display:none; }
  .show-sm{ display:block; }
}
`;
