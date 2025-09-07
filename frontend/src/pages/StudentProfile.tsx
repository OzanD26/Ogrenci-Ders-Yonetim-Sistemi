import { useEffect, useMemo, useState } from "react";
import client from "../api/client";

/* ---------- Types ---------- */
type Me = {
  id: number;
  email: string;
  role: "STUDENT";
  firstName: string;
  lastName: string;
  /** yyyy-MM-dd */
  birthDate: string;
};
type ProfileForm = { firstName: string; lastName: string; birthDate: string };

/* ---------- Component ---------- */
export default function StudentProfile() {
  const [me, setMe] = useState<Me | null>(null);
  const [profile, setProfile] = useState<ProfileForm>({
    firstName: "",
    lastName: "",
    birthDate: "",
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const todayStr = useMemo(() => fmtDateInput(new Date()), []);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true); setErr(""); setOk("");
    try {
      const res = await client.get<Me>("/me");
      setMe(res.data);
      setProfile({
        firstName: res.data.firstName ?? "",
        lastName: res.data.lastName ?? "",
        birthDate: res.data.birthDate ?? "",
      });
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? e?.response?.data?.error ?? e?.message;
      setErr(msg || "Profil yüklenemedi");
    } finally { setLoading(false); }
  }

  function validate(p: ProfileForm): string | null {
    if (!p.firstName.trim()) return "Ad zorunludur.";
    if (!p.lastName.trim()) return "Soyad zorunludur.";
    if (!p.birthDate) return "Doğum tarihi zorunludur.";
    const b = new Date(p.birthDate + "T00:00:00");
    if (Number.isNaN(b.getTime())) return "Doğum tarihi geçersiz.";
    const t = new Date();
    if (b > new Date(t.getFullYear(), t.getMonth(), t.getDate())) return "Doğum tarihi gelecekte olamaz.";
    return null;
  }

  async function save(e: React.FormEvent) {
    e.preventDefault(); setErr(""); setOk("");
    const v = validate(profile); if (v) return setErr(v);
    setSaving(true);
    try {
      const res = await client.put<Me>("/me", {
        firstName: profile.firstName.trim(),
        lastName: profile.lastName.trim(),
        birthDate: profile.birthDate, // yyyy-MM-dd
      });
      setOk("Profilin güncellendi.");
      setMe(res.data);
      setProfile({
        firstName: res.data.firstName ?? "",
        lastName: res.data.lastName ?? "",
        birthDate: res.data.birthDate ?? "",
      });
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? e?.response?.data?.error ?? e?.message;
      setErr(msg || "Kaydetme başarısız oldu");
    } finally { setSaving(false); }
  }

  function cancel() {
    if (!me) return;
    setProfile({
      firstName: me.firstName ?? "",
      lastName: me.lastName ?? "",
      birthDate: me.birthDate ?? "",
    });
    setErr(""); setOk("");
  }

  return (
    <div style={ui.shell}>
      <style>{globalCss}</style>

      {/* Top bar (full width) */}
      <header style={ui.topbar}>
        <div style={ui.brand}>
          <span style={ui.brandDot} aria-hidden="true" />
          <strong>StudentCourse</strong>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={ui.avatarSm}>{initials(profile.firstName, profile.lastName)}</div>
        </div>
      </header>

      {/* Page */}
      <main style={ui.page}>
        <div style={ui.card}>
          {/* Card header */}
          <div style={ui.cardHeader}>
            <button type="button" style={ui.backBtn} onClick={() => history.back()}>
              ← Geri
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div>
                <h2 style={ui.title}>Profili Düzenle</h2>
                <p style={ui.sub}>Profil bilgilerini güncelle.</p>
              </div>
              <div style={{ marginLeft: "auto" }}>
                <div style={ui.avatarLg}>{initials(profile.firstName, profile.lastName)}</div>
              </div>
            </div>
          </div>

          {/* Alerts */}
          {err && <div style={ui.alertErr}><WarnIcon /> <span>{err}</span></div>}
          {ok && <div style={ui.alertOk}><CheckIcon /> <span>{ok}</span></div>}
          {loading && <div style={ui.skel} />}

          {/* Form */}
          {!loading && (
            <form onSubmit={save} style={ui.form}>
              <div style={ui.grid2}>
                <label style={ui.label}>
                  <span>Ad</span>
                  <input
                    style={ui.input}
                    value={profile.firstName}
                    onChange={(e)=>setProfile({...profile, firstName:e.target.value})}
                    placeholder="Ayşe"
                  />
                </label>

                <label style={ui.label}>
                  <span>Soyad</span>
                  <input
                    style={ui.input}
                    value={profile.lastName}
                    onChange={(e)=>setProfile({...profile, lastName:e.target.value})}
                    placeholder="Yılmaz"
                  />
                </label>

                <label style={ui.label}>
                  <span>E-posta adresi</span>
                  <input style={ui.input} value={me?.email ?? ""} disabled />
                </label>

                <label style={ui.label}>
                  <span>Doğum tarihi</span>
                  <input
                    type="date"
                    max={todayStr}
                    style={ui.input}
                    value={profile.birthDate}
                    onChange={(e)=>setProfile({...profile, birthDate:e.target.value})}
                  />
                </label>
              </div>

              {/* Actions */}
              <div style={ui.actions}>
                <button type="button" style={ui.btnGhost} onClick={cancel} disabled={saving}>
                  İptal
                </button>
                <button type="submit" style={ui.btnPrimary} aria-busy={saving}>
                  Değişiklikleri Kaydet
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}

/* ---------- Helpers ---------- */
function fmtDateInput(d: Date){
  const y=d.getFullYear(); const m=String(d.getMonth()+1).padStart(2,"0"); const day=String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${day}`;
}
function initials(a?: string, b?: string){
  const i1=(a??"").trim().charAt(0).toUpperCase();
  const i2=(b??"").trim().charAt(0).toUpperCase();
  return (i1+i2) || "NA";
}

/* ---------- Icons ---------- */
function WarnIcon(){return(<svg width="16" height="16" viewBox="0 0 20 20"><path fill="currentColor" d="M10 2l9 16H1L10 2zm-1 6h2v4H9V8zm0 6h2v2H9v-2z"/></svg>);}
function CheckIcon(){return(<svg width="16" height="16" viewBox="0 0 20 20"><path fill="currentColor" d="M7.7 13.3L4.4 10l-1.4 1.4l4.7 4.7l10-10L16.3 4L7.7 12.6z"/></svg>);}

/* ---------- Styles ---------- */
const ui: Record<string, React.CSSProperties> = {
  shell: { minHeight:"100dvh", background:"linear-gradient(180deg,#f6f8fc,#ffffff)", color:"#0f172a" },

  topbar: {
    position:"sticky", top:0, zIndex:20,
    display:"grid", gridTemplateColumns:"auto 1fr auto", alignItems:"center", gap:12,
    padding:"10px 16px",
    background:"rgba(255,255,255,.9)", backdropFilter:"saturate(140%) blur(6px)",
    borderBottom:"1px solid #e5e7eb",
  },
  brand: { display:"inline-flex", alignItems:"center", gap:8, fontWeight:800 },
  brandDot: { width:10, height:10, borderRadius:999, background:"#3b82f6", boxShadow:"0 0 0 6px rgba(59,130,246,.18)" },
  avatarSm: { width:32, height:32, borderRadius:999, display:"grid", placeItems:"center", background:"#eef2ff", color:"#3730a3", fontWeight:800, border:"1px solid #e5e7eb" },

  page: { maxWidth:960, margin:"0 auto", padding:"16px" },

  card: {
    background:"#fff", border:"1px solid #e5e7eb", borderRadius:16, boxShadow:"0 10px 28px -18px rgba(0,0,0,.25)",
    padding:16, display:"grid", gap:12
  },
  cardHeader: { display:"grid", gap:8 },
  backBtn: {
    width:"fit-content",
    background:"transparent", border:"1px solid #e5e7eb", color:"#334155",
    borderRadius:10, padding:"6px 10px", cursor:"pointer"
  },
  title: { margin:0, fontSize:22, letterSpacing:.2 },
  sub: { margin:"2px 0 0", color:"#64748b", fontSize:14 },
  avatarLg: { width:48, height:48, borderRadius:999, display:"grid", placeItems:"center", background:"#eef2ff", color:"#3730a3", fontWeight:800, border:"1px solid #e5e7eb" },

  alertErr: { display:"flex", alignItems:"center", gap:8, border:"1px solid #fecaca", background:"#fff1f2", color:"#b91c1c", padding:"8px 10px", borderRadius:12 },
  alertOk:  { display:"flex", alignItems:"center", gap:8, border:"1px solid #bbf7d0", background:"#ecfdf5", color:"#166534", padding:"8px 10px", borderRadius:12 },

  skel: {
    height:140, borderRadius:12, border:"1px solid #e5e7eb",
    background:"linear-gradient(90deg,#f6f7fb 0%,#eceff5 50%,#f6f7fb 100%)",
    backgroundSize:"200% 100%", animation:"shimmer 1.2s linear infinite"
  },

  form: { display:"grid", gap:12 },
  grid2: { display:"grid", gap:12, gridTemplateColumns:"repeat(2, minmax(0,1fr))" },
  label: { display:"grid", gap:6, fontSize:14, color:"#0f172a" },
  input: { padding:"10px 12px", borderRadius:10, border:"1px solid #e5e7eb", outline:"none", background:"#fff" },

  actions: { display:"flex", justifyContent:"flex-end", gap:8, paddingTop:4 },
  btnGhost: {
    padding:"10px 14px", borderRadius:10, border:"1px solid #e5e7eb",
    background:"#fff", color:"#334155", cursor:"pointer"
  },
  btnPrimary: {
    padding:"10px 14px", borderRadius:10, border:"1px solid #3b82f6",
    background:"linear-gradient(180deg,#60a5fa,#3b82f6)", color:"#fff", cursor:"pointer",
    boxShadow:"0 10px 24px rgba(59,130,246,.25)"
  },
};

/* Small global helper anim */
const globalCss = `
@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
@media (max-width: 720px){
  /* form tek kolona düşsün */
  main .grid2{ grid-template-columns: 1fr !important; }
}
`;
