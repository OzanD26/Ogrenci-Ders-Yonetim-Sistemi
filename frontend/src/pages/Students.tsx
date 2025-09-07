import { useEffect, useMemo, useState } from "react";
import client from "../api/client";
import { Pagination } from "../components/Pagination";

/* ---------- Types ---------- */
type Student = { id: number; firstName: string; lastName: string; birthDate: string };
type Paged<T> = { items: T[]; total: number; page: number; pageSize: number };
type FormState = { id?: number; firstName: string; lastName: string; birthDate: string };
type Enrollment = { id: number; course: { id: number; name: string } };
type StudentDetail = Student & { enrollments?: Enrollment[] | null };

export default function Students() {
  /* list */
  const [data, setData] = useState<Paged<Student>>({ items: [], total: 0, page: 1, pageSize: 10 });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  /* search */
  const [q, setQ] = useState("");
  const norm = (s: string) =>
    (s || "").toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");

  /* create/edit modal */
  const [isOpen, setIsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState("");
  const [form, setForm] = useState<FormState>({ firstName: "", lastName: "", birthDate: "" });

  /* detail modal */
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailErr, setDetailErr] = useState("");
  const [detail, setDetail] = useState<StudentDetail | null>(null);

  const todayStr = useMemo(() => formatDateInput(new Date()), []);

  /* data load (server pagination) */
  async function load(p: number) {
    setLoading(true);
    setErr("");
    try {
      const res = await client.get<Paged<Student>>(`/students?page=${p}&pageSize=${data.pageSize}`);
      setData(res.data);
    } catch (e: any) {
      setErr(e?.response?.data?.message ?? e?.message ?? "Yüklenemedi");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(1); /* eslint-disable-next-line */ }, []);

  /* client-side filter (current page items) */
  const filtered = useMemo(() => {
    const s = norm(q.trim());
    if (!s) return data.items;
    return data.items.filter((stu) => {
      const full = `${stu.firstName} ${stu.lastName}`;
      return (
        norm(full).includes(s) ||
        String(stu.id).includes(s) ||
        (stu.birthDate && norm(toInputFromISO(stu.birthDate)).includes(s))
      );
    });
  }, [q, data.items]);

  /* create/edit */
  function openCreate() {
    setForm({ firstName: "", lastName: "", birthDate: "" });
    setFormErr("");
    setIsOpen(true);
  }
  function openEdit(s: Student) {
    setForm({ id: s.id, firstName: s.firstName, lastName: s.lastName, birthDate: toInputFromISO(s.birthDate) });
    setFormErr("");
    setIsOpen(true);
  }
  function closeCreateEdit() { setIsOpen(false); setSaving(false); setFormErr(""); }

  async function submitForm(e: React.FormEvent) {
    e.preventDefault();
    setFormErr("");
    if (!form.firstName?.trim() || !form.lastName?.trim() || !form.birthDate) {
      return setFormErr("Tüm alanların doldurulması zorunludur.");
    }
    setSaving(true);
    try {
      const payload = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        birthDate: new Date(form.birthDate + "T00:00:00").toISOString(),
      };
      if (form.id) await client.put(`/students/${form.id}`, payload);
      else await client.post(`/students`, payload);
      closeCreateEdit();
      await load(1);
    } catch (e: any) {
      setFormErr(e?.response?.data?.message ?? e?.message ?? "Kaydetme başarısız oldu");
      setSaving(false);
    }
  }

  async function removeStudent(id: number) {
    if (!confirm("Bu öğrenciyi silmek istiyor musunuz?")) return;
    try { await client.delete(`/students/${id}`); await load(data.page); }
    catch (e: any) { alert(e?.response?.data?.message ?? e?.message ?? "Silme başarısız oldu"); }
  }

  /* detail modal */
  async function openDetail(studentId: number) {
    setDetailOpen(true);
    setDetail(null);
    setDetailErr("");
    setDetailLoading(true);
    try {
      const res = await client.get<StudentDetail>(`/students/${studentId}`);
      setDetail(res.data);
    } catch (e: any) {
      setDetailErr(e?.response?.data?.message ?? e?.message ?? "Öğrenci detayı yüklenemedi");
    } finally {
      setDetailLoading(false);
    }
  }
  function closeDetail() { setDetailOpen(false); setDetail(null); }

  return (
    <section className="as-wrap">
      <style>{css}</style>

      <header className="as-header">
        <div>
          <h1>Öğrenci Yönetimi</h1>
          <p>Öğrencileri ara, ekle, düzenle ve sil.</p>
          <small className="as-muted">Toplam: {data.total}</small>
        </div>
        <button className="as-add" onClick={openCreate}><span>＋</span> Yeni Öğrenci Ekle</button>
      </header>

      {/* SEARCH */}
      <div className="as-search">
        <span className="as-search-ic">🔎</span>
        <input
          placeholder="İsim, ID veya doğum tarihine göre ara…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {err && <div className="as-error">{err}</div>}

      {loading ? (
        <div className="as-skel" />
      ) : (
        <div className="as-table">
          <div className="as-thead">
            <div>İsim</div>
            <div className="hide-sm">Öğrenci No</div>
            <div className="hide-sm">Doğum Tarihi</div>
            <div className="as-right">İşlemler</div>
          </div>
          <div className="as-tbody">
            {filtered.map((s) => (
              <div className="as-row" key={s.id}>
                <button className="as-name as-linklike" onClick={() => openDetail(s.id)} title="Detayı göster">
                  <div className="as-avatar">{initials(s.firstName, s.lastName)}</div>
                  <div className="as-col">
                    <div className="as-strong">{s.firstName} {s.lastName}</div>
                    <div className="as-muted show-sm">ID STU{String(s.id).padStart(5, "0")}</div>
                  </div>
                </button>

                <div className="hide-sm">STU{String(s.id).padStart(5, "0")}</div>
                <div className="hide-sm">{toInputFromISO(s.birthDate)}</div>

                <div className="as-right as-actions">
                  <button className="as-icon" title="Düzenle" onClick={() => openEdit(s)}>✏️</button>
                  <button className="as-icon danger" title="Sil" onClick={() => removeStudent(s.id)}>🗑️</button>
                </div>
              </div>
            ))}
            {!filtered.length && <div className="as-empty">Hiç öğrenci bulunamadı.</div>}
          </div>
        </div>
      )}

      {/* PAGINATION */}
      <footer style={{ display: "flex", justifyContent: "flex-end" }}>
        <Pagination
          page={data.page}
          pageSize={data.pageSize}
          total={data.total}
          onChange={(p) => load(p)}
        />
      </footer>

      {/* CREATE / EDIT MODAL */}
      {isOpen && (
        <dialog open className="as-dialog" onClose={closeCreateEdit}>
          <article className="as-modal">
            <header>
              <strong>{form.id ? "Öğrenciyi Düzenle" : "Öğrenci Ekle"}</strong>
              <button type="button" className="as-close" onClick={closeCreateEdit}>Kapat</button>
            </header>

            <form onSubmit={submitForm} className="as-form">
              <label>Ad
                <input value={form.firstName} onChange={(e)=>setForm({...form, firstName:e.target.value})} placeholder="örn. Ahmet"/>
              </label>
              <label>Soyad
                <input value={form.lastName} onChange={(e)=>setForm({...form, lastName:e.target.value})} placeholder="örn. Yılmaz"/>
              </label>
              <label>Doğum tarihi
                <input type="date" max={todayStr} value={form.birthDate} onChange={(e)=>setForm({...form, birthDate:e.target.value})}/>
                <small>Doğum tarihi gelecekte olamaz.</small>
              </label>

              {formErr && <div className="as-error">{formErr}</div>}

              <div className="as-form-actions">
                <button type="button" className="btn-secondary" onClick={closeCreateEdit} disabled={saving}>İptal</button>
                <button type="submit" aria-busy={saving}>{form.id ? "Kaydet" : "Oluştur"}</button>
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
              <strong>Öğrenci Detayı</strong>
              <button type="button" className="as-close" onClick={closeDetail}>Kapat</button>
            </header>

            {detailLoading && <progress />}
            {detailErr && <div className="as-error">{detailErr}</div>}

            {detail && (
              <div className="as-detail">
                <div className="as-detail-header">
                  <div className="as-avatar lg">{initials(detail.firstName, detail.lastName)}</div>
                  <div>
                    <div className="as-strong" style={{ fontSize: 16 }}>
                      {detail.firstName} {detail.lastName}
                    </div>
                    <div className="as-muted">Doğum: {toInputFromISO(detail.birthDate)}</div>
                  </div>
                </div>

                <div className="divider" />

                <div>
                  <h4 className="as-subtitle">Kayıtlı Dersler</h4>
                  <ul className="as-chip-list">
                    {(detail.enrollments ?? []).map((e) => (
                      <li className="chip" key={e.id}>{e.course.name}</li>
                    ))}
                    {(!detail.enrollments || detail.enrollments.length === 0) && (
                      <li className="as-muted">Kayıtlı ders bulunmamaktadır.</li>
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
/* ---------- Helpers ---------- */
function initials(a?: string, b?: string) {
  const i1 = (a ?? "").trim().charAt(0).toUpperCase();
  const i2 = (b ?? "").trim().charAt(0).toUpperCase();
  return (i1 + i2) || "NA";
}
function toInputFromISO(iso: string) {
  const d = new Date(iso);
  return formatDateInput(d);
}
function formatDateInput(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/* ---------- CSS (inline) ---------- */
const css = `
:root{
  --bg:#0d1016; --panel:#10161e; --ink:#e9edf4; --muted:#95a0b1;
  --line:#1b2433; --accent:#22c55e; --accent-700:#16a34a; --focus: rgba(34,197,94,.18);
}
.as-wrap{ color:var(--ink); display:grid; gap:16px; }

/* header */
.as-header{ display:flex; justify-content:space-between; align-items:flex-end; gap:12px; padding:6px 2px; }
.as-header h1{ margin:0; font-size:28px; font-weight:800; letter-spacing:.2px; }
.as-header p{ margin:6px 0 0; color:var(--muted); }
.as-add{
  display:inline-flex; align-items:center; gap:10px;
  background:linear-gradient(180deg, var(--accent), var(--accent-700));
  color:#062b14; border:0; border-radius:12px; padding:10px 14px;
  font-weight:800; letter-spacing:.2px; cursor:pointer;
  box-shadow:0 10px 24px rgba(34,197,94,.25), inset 0 -2px 0 rgba(0,0,0,.25);
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
  display:grid;
  grid-template-columns: 2.2fr 1fr .9fr auto;
  gap:12px; padding:12px 14px;
  border-bottom:1px solid var(--line);
  color:#cfe6d8; background:#0e141b; font-weight:700; font-size:13px;
}
.as-tbody{ display:grid; }
.as-row{
  display:grid;
  grid-template-columns: 2.2fr 1fr .9fr auto;
  gap:12px; padding:12px 14px; border-top:1px solid #131a23;
  background:#0f151c;
}
.as-row:nth-child(even){ background:#101821; }

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

.as-right{ justify-self:end; }
.as-actions{ display:flex; gap:8px; }
.as-icon{
  background:#0c1218; color:#cfe6d8; border:1px solid #24322a;
  border-radius:10px; padding:8px 10px; cursor:pointer;
}
.as-icon:hover{ border-color:#335142; box-shadow:0 0 0 4px var(--focus); }
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

/* dialog (popup) */
.as-dialog[open]{
  position: fixed; inset: 0; display: grid; place-items: center;
  padding: 0; border: none; background: transparent; z-index: 60;
}
.as-dialog::backdrop{ background: rgba(2, 6, 23, 0.55); backdrop-filter: blur(2px); }
.as-modal{
  width: min(560px, 92vw); background: #0e141b; color: var(--ink);
  border: 1px solid var(--line); border-radius: 16px; box-shadow: 0 18px 50px rgba(0,0,0,.45);
  padding: 16px; display: grid; gap: 12px;
}
.as-modal header{ display:flex; align-items:center; gap:8px; }
.as-close{
  margin-left:auto; background:#0c1218; color:#cfe6d8;
  border:1px solid #24322a; border-radius:10px; padding:8px 10px; cursor:pointer;
}
.as-close:hover{ border-color:#335142; box-shadow:0 0 0 4px var(--focus); }

.as-form{ display:grid; gap:10px; }
.as-form label{ display:grid; gap:6px; font-size:14px; }
.as-form input{
  background:#0c1118; color:var(--ink);
  border:1px solid var(--line); border-radius:10px; padding:10px 12px;
}
.as-form input:focus{ border-color:#274536; box-shadow:0 0 0 4px var(--focus); }
.as-form-actions{ display:grid; grid-template-columns:1fr 1fr; gap:8px; }

/* detail modal */
.as-detail{ display:grid; gap:12px; }
.as-detail-header{ display:flex; gap:12px; align-items:center; }
.divider{ height:1px; background:#1b2433; border-radius:1px; }
.as-subtitle{ margin:0 0 6px; font-weight:800; font-size:14px; }
.as-chip-list{ list-style:none; padding:0; margin:0; display:flex; flex-wrap:wrap; gap:8px; }
.chip{ padding:6px 10px; border:1px solid #24322a; background:#0c1218; border-radius:999px; font-size:12px; color:#cfe6d8; }

/* responsive */
.hide-sm{ display:block; }
.show-sm{ display:none; }
@media (max-width: 880px){
  .as-thead, .as-row{ grid-template-columns: 2.2fr .9fr auto; }
  .hide-sm{ display:none; }
  .show-sm{ display:block; }
}
`;
