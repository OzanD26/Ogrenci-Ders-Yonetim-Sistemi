import { useEffect, useMemo, useState } from "react";
import client from "../api/client";
import { Pagination } from "../components/Pagination";

/* ---------- Types ---------- */
type Student = { id: number; firstName: string; lastName: string };
type Course  = { id: number; name: string };

type Enrollment = {
  id: number;
  studentId: number;
  courseId: number;
  student?: Student;
  course?: Course;
  createdAt?: string;
};
type Paged<T> = { items: T[]; total: number; page: number; pageSize: number };

export default function Enrollments() {
  /* picklists */
  const [students, setStudents] = useState<Student[]>([]);
  const [courses,  setCourses]  = useState<Course[]>([]);

  /* modal (create) */
  const [addOpen, setAddOpen] = useState(false);
  const [studentId, setStudentId] = useState<number | "">("");
  const [courseId,  setCourseId]  = useState<number | "">("");
  const [saving, setSaving]       = useState(false);
  const [formErr, setFormErr]     = useState("");

  /* list */
  const [data, setData] = useState<Paged<Enrollment>>({
    items: [], total: 0, page: 1, pageSize: 10,
  });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  /* search (opsiyonel) */
  const [q, setQ] = useState("");

  useEffect(() => {
    loadPicklists(); load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadPicklists() {
    try {
      const [s, c] = await Promise.all([
        client.get<Paged<Student>>(`/students?page=1&pageSize=1000`),
        client.get<Paged<Course>>(`/courses?page=1&pageSize=1000`),
      ]);
      setStudents(s.data.items);
      setCourses(c.data.items);
    } catch { /* sessiz */ }
  }

  async function load(p: number) {
    setLoading(true); setErr("");
    try {
      const res = await client.get<Paged<Enrollment>>(`/enrollments?page=${p}&pageSize=${data.pageSize}`);
      setData(res.data);
    } catch (e:any) {
      setErr(e?.response?.data?.message ?? e?.message ?? "Kayıtlar yüklenemedi");
    } finally { setLoading(false); }
  }

  /* --- create modal --- */
  function openAdd(){ setStudentId(""); setCourseId(""); setFormErr(""); setAddOpen(true); }
  function closeAdd(){ setAddOpen(false); setSaving(false); setFormErr(""); }

  function validate(): string | null {
    if (!studentId) return "Lütfen bir öğrenci seçin.";
    if (!courseId)  return "Lütfen bir ders seçin.";
    return null;
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const v = validate(); if (v) return setFormErr(v);
    setSaving(true);
    try {
      await client.post(`/enrollments`, { studentId: Number(studentId), courseId: Number(courseId) });
      closeAdd(); await load(1);
    } catch (e:any) {
      const status = e?.response?.status;
      const msg = status === 409
        ? "Bu öğrenci seçilen derse zaten kayıtlı."
        : e?.response?.data?.message ?? e?.message ?? "Kayıt ekleme başarısız oldu";
      setFormErr(msg); setSaving(false);
    }
  }

  /* delete */
  async function removeEnrollment(id: number) {
    if (!confirm("Bu kaydı kaldırmak istiyor musunuz?")) return;
    setErr("");
    try { await client.delete(`/enrollments/${id}`); await load(data.page); }
    catch (e:any) { setErr(e?.response?.data?.message ?? e?.message ?? "Kaldırma başarısız oldu"); }
  }

  /* search/filter (öğrenci adı veya ders adına göre) */
  const items = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return data.items;
    return data.items.filter(e =>
      (`${e.student?.firstName ?? ""} ${e.student?.lastName ?? ""}`.toLowerCase().includes(s)) ||
      (`${e.course?.name ?? ""}`.toLowerCase().includes(s)) ||
      String(e.id).includes(s)
    );
  }, [q, data.items]);

  return (
    <section className="enr-wrap">
      <style>{css}</style>

      {/* Header */}
      <header className="as-header">
        <div>
          <h1>Kayıtlar</h1>
          <p>Öğrencilere ders ata veya mevcut kayıtları kaldır.</p>
          <small className="as-muted">Toplam: {data.total}</small>
        </div>
        <button className="as-add" onClick={openAdd}><span>＋</span> Kayıt Ekle</button>
      </header>

      {/* Search */}
      <div className="as-search">
        <span className="as-search-ic">🔎</span>
        <input
          placeholder="Öğrenci, ders veya kayıt numarasına göre ara…"
          value={q}
          onChange={(e)=>setQ(e.target.value)}
        />
      </div>

      {err && <div className="as-error">{err}</div>}

      {/* Table */}
      {loading ? (
        <div className="as-skel" />
      ) : (
        <div className="as-table">
          <div className="as-thead enr-cols">
            <div>Öğrenci</div>
            <div>Ders</div>
            <div className="hide-sm">Kayıt Tarihi</div>
            <div className="as-right">İşlemler</div>
          </div>

          <div className="as-tbody">
            {items.map((e) => (
              <div className="as-row enr-cols" key={e.id}>
                {/* Student cell */}
                <div className="as-name">
                  <div className="as-avatar">
                    {initials(e.student?.firstName, e.student?.lastName)}
                  </div>
                  <div className="as-col">
                    <div className="as-strong">
                      {e.student ? `${e.student.firstName} ${e.student.lastName}` : `#${e.studentId}`}
                    </div>
                    <div className="as-muted show-sm">ID #{e.id}</div>
                  </div>
                </div>

                {/* Course cell */}
                <div className="as-col">
                  <div className="as-strong">{e.course?.name ?? `#${e.courseId}`}</div>
                  <div className="as-muted show-sm">
                    {e.createdAt ? new Date(e.createdAt).toLocaleDateString("tr-TR") : ""}
                  </div>
                </div>

                {/* Date */}
                <div className="hide-sm">
                  {e.createdAt ? new Date(e.createdAt).toLocaleDateString("tr-TR") : "—"}
                </div>

                {/* Actions */}
                <div className="as-right as-actions">
                  <button className="as-icon danger" title="Kaldır" onClick={()=>removeEnrollment(e.id)}>🗑️</button>
                </div>
              </div>
            ))}
            {!items.length && <div className="as-empty">Hiç kayıt bulunamadı.</div>}
          </div>
        </div>
      )}

      <footer style={{ display:"flex", justifyContent:"flex-end" }}>
        <Pagination
          page={data.page}
          pageSize={data.pageSize}
          total={data.total}
          onChange={(p)=>load(p)}
        />
      </footer>

      {/* ADD MODAL */}
      {addOpen && (
        <dialog open className="as-dialog" onClose={closeAdd}>
          <article className="as-modal">
            <header>
              <strong>Kayıt Ekle</strong>
              <button type="button" className="as-close" onClick={closeAdd}>Kapat</button>
            </header>

            <form className="as-form" onSubmit={submit}>
              <label>Öğrenci
                <select
                  value={studentId}
                  onChange={(e)=>setStudentId(e.target.value ? Number(e.target.value) : "")}
                  className="as-input"
                >
                  <option value="">Öğrenci seçin</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>
                  ))}
                </select>
              </label>

              <label>Ders
                <select
                  value={courseId}
                  onChange={(e)=>setCourseId(e.target.value ? Number(e.target.value) : "")}
                  className="as-input"
                >
                  <option value="">Ders seçin</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </label>

              {formErr && <div className="as-error">{formErr}</div>}

              <div className="as-form-actions">
                <button type="button" className="btn-secondary" onClick={closeAdd} disabled={saving}>İptal</button>
                <button type="submit" aria-busy={saving} disabled={!studentId || !courseId}>Kaydı Oluştur</button>
              </div>
            </form>
          </article>
        </dialog>
      )}
    </section>
  );
}
/* ---------- Helpers ---------- */
function initials(a?: string, b?: string) {
  const i1 = (a ?? "").trim().charAt(0).toUpperCase();
  const i2 = (b ?? "").trim().charAt(0).toUpperCase();
  return (i1 + i2) || "NA";
}

/* ---------- CSS (Students/Courses ile birebir) ---------- */
const css = `
:root{
  --bg:#0d1016; --panel:#10161e; --ink:#e9edf4; --muted:#95a0b1;
  --line:#1b2433; --accent:#22c55e; --accent-700:#16a34a; --focus: rgba(34,197,94,.18);
}
.enr-wrap{ color:var(--ink); display:grid; gap:16px; }

/* header & buttons */
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
.as-muted{ color:var(--muted); }

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
.enr-cols{ grid-template-columns: 2.2fr 2fr 1fr auto; }
.as-thead{
  display:grid; gap:12px; padding:12px 14px; border-bottom:1px solid var(--line);
  color:#cfe6d8; background:#0e141b; font-weight:700; font-size:13px;
}
.as-tbody{ display:grid; }
.as-row{
  display:grid; gap:12px; padding:12px 14px; border-top:1px solid #131a23; background:#0f151c;
}
.as-row:nth-child(even){ background:#101821; }

/* cells */
.as-name{ display:flex; gap:12px; align-items:center; }
.as-avatar{
  width:36px; height:36px; border-radius:10px; display:grid; place-items:center;
  background:#0c1218; border:1px solid #23312a; font-weight:800;
}
.as-col{ display:grid; }
.as-strong{ font-weight:800; }

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

/* dialog */
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
.as-input,
.as-form select{
  background:#0c1118; color:var(--ink);
  border:1px solid var(--line); border-radius:10px; padding:10px 12px;
}
.as-form select:focus{ border-color:#274536; box-shadow:0 0 0 4px var(--focus); }
.as-form-actions{ display:grid; grid-template-columns:1fr 1fr; gap:8px; }

/* responsive */
.hide-sm{ display:block; }
.show-sm{ display:none; }
@media (max-width: 880px){
  .enr-cols{ grid-template-columns: 2fr 1.4fr auto; }
  .hide-sm{ display:none; }
  .show-sm{ display:block; }
}
`;
