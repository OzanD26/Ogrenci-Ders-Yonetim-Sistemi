import { useEffect, useMemo, useState } from "react";
import client from "../api/client";

/** ---------- Types ---------- */
type Me = {
  id: number;
  email: string;
  role: "STUDENT";
  createdAt?: string;
  student?: {
    id: number;
    firstName: string;
    lastName: string;
    birthDate: string; // ISO
  } | null;
};

type Course = { id: number; name: string };
type Paged<T> = { items: T[]; total: number; page: number; pageSize: number };

type ProfileForm = {
  firstName: string;
  lastName: string;
  birthDate: string; // yyyy-MM-dd (input)
};

export default function StudentHome() {
  /** ---------- State ---------- */
  const [me, setMe] = useState<Me | null>(null);
  const [loadingMe, setLoadingMe] = useState(false);
  const [meErr, setMeErr] = useState("");

  const [profile, setProfile] = useState<ProfileForm>({
    firstName: "",
    lastName: "",
    birthDate: "",
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileErr, setProfileErr] = useState("");
  const todayStr = useMemo(() => formatDateInput(new Date()), []);

  // kayıtlı dersler
  const [myCourses, setMyCourses] = useState<Course[]>([]);
  const [loadingMyCourses, setLoadingMyCourses] = useState(false);
  const [coursesErr, setCoursesErr] = useState("");

  // yeni derse kayıt
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [loadingAllCourses, setLoadingAllCourses] = useState(false);
  const [enrollCourseId, setEnrollCourseId] = useState<number | "">("");
  const [enrollErr, setEnrollErr] = useState("");
  const [enrolling, setEnrolling] = useState(false);

  /** ---------- Effects ---------- */
  useEffect(() => {
    loadMe();
    loadMyCourses();
    // tüm dersler picklist için
    loadAllCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** ---------- Loaders ---------- */
  async function loadMe() {
    setLoadingMe(true);
    setMeErr("");
    try {
      const res = await client.get<{ user: Me }>("/me");
      setMe(res.data.user);
      const s = res.data.user.student;
      if (s) {
        setProfile({
          firstName: s.firstName ?? "",
          lastName: s.lastName ?? "",
          birthDate: toInputFromISO(s.birthDate),
        });
      }
    } catch (e: any) {
      setMeErr(e?.response?.data?.message ?? e?.message ?? "Profil yüklenemedi");
    } finally {
      setLoadingMe(false);
    }
  }

  async function loadMyCourses() {
    setLoadingMyCourses(true);
    setCoursesErr("");
    try {
      // backend: GET /me/courses → { items: Course[] }  (önceki servis)
      const res = await client.get<{ items: Course[] }>("/me/courses");
      setMyCourses(res.data.items);
    } catch (e: any) {
      setCoursesErr(e?.response?.data?.message ?? e?.message ?? "Dersler yüklenemedi");
    } finally {
      setLoadingMyCourses(false);
    }
  }

  async function loadAllCourses() {
    setLoadingAllCourses(true);
    try {
      // küçük sistemlerde büyük pageSize almak pratik
      const res = await client.get<Paged<Course>>("/courses?page=1&pageSize=1000");
      setAllCourses(res.data.items);
    } catch (e) {
      // sessiz geç
    } finally {
      setLoadingAllCourses(false);
    }
  }

  /** ---------- Profile Update ---------- */
  function validateProfile(p: ProfileForm): string | null {
    if (!p.firstName.trim()) return "Ad zorunludur.";
    if (!p.lastName.trim()) return "Soyad zorunludur.";
    if (!p.birthDate) return "Doğum tarihi zorunludur.";
    const b = new Date(p.birthDate + "T00:00:00");
    if (Number.isNaN(b.getTime())) return "Doğum tarihi geçersiz.";
    const today = new Date();
    if (b > new Date(today.getFullYear(), today.getMonth(), today.getDate())) {
      return "Doğum tarihi gelecekte olamaz.";
    }
    return null;
  }

  async function submitProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileErr("");
    const v = validateProfile(profile);
    if (v) return setProfileErr(v);

    setSavingProfile(true);
    try {
      // backend: PUT /me  (sadece STUDENT erişimi)
      await client.put("/me", {
        firstName: profile.firstName.trim(),
        lastName: profile.lastName.trim(),
        birthDate: new Date(profile.birthDate + "T00:00:00").toISOString(),
      });
      await loadMe();
    } catch (e: any) {
      setProfileErr(e?.response?.data?.message ?? e?.message ?? "Profil güncellenemedi");
    } finally {
      setSavingProfile(false);
    }
  }

  /** ---------- Enroll & Drop ---------- */
  const enrolledIds = new Set(myCourses.map((c) => c.id));
  const availableCourses = allCourses.filter((c) => !enrolledIds.has(c.id));

  async function enroll() {
    if (!enrollCourseId) return;
    setEnrollErr("");
    setEnrolling(true);
    try {
      // backend: POST /me/enroll  { courseId }
      await client.post("/me/enroll", { courseId: Number(enrollCourseId) });
      setEnrollCourseId("");
      await Promise.all([loadMyCourses()]);
    } catch (e: any) {
      const msg =
        e?.response?.status === 409
          ? "Bu derse zaten kayıtlısın."
          : e?.response?.data?.message ?? e?.message ?? "Kayıt başarısız oldu";
      setEnrollErr(msg);
    } finally {
      setEnrolling(false);
    }
  }

  async function drop(courseId: number) {
    if (!confirm("Bu dersi bırakmak istiyor musun?")) return;
    setCoursesErr("");
    try {
      // backend: DELETE /me/enroll/:courseId
      await client.delete(`/me/enroll/${courseId}`);
      await loadMyCourses();
    } catch (e: any) {
      setCoursesErr(e?.response?.data?.message ?? e?.message ?? "Bırakma başarısız oldu");
    }
  }

  /** ---------- UI ---------- */
  return (
    <section style={sx.section}>
      <header style={sx.header}>
        <div>
          <h2 style={sx.title}>
            <span style={sx.dot} aria-hidden="true" /> Öğrenci Portalı
          </h2>
          <p style={sx.subtitle}>
            Profilini görüntüle ve güncelle. Ders kayıtlarını yönet.
          </p>
        </div>
        <span style={sx.badge}>{me?.email ?? ""}</span>
      </header>

      {/* Errors */}
      {meErr && <div style={sx.error}><WarnIcon/>{meErr}</div>}

      {/* Profile Card */}
      <article style={sx.card}>
        <div style={{ display: "grid", gap: 10 }}>
          <h3 style={sx.cardTitle}>Profilim</h3>
          {loadingMe ? (
            <div style={sx.skeleton} />
          ) : (
            <form onSubmit={submitProfile} style={sx.formGrid}>
              <label style={sx.label}>
                <span>Ad</span>
                <input
                  style={sx.input}
                  value={profile.firstName}
                  onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                />
              </label>
              <label style={sx.label}>
                <span>Soyad</span>
                <input
                  style={sx.input}
                  value={profile.lastName}
                  onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                />
              </label>
              <label style={sx.label}>
                <span>Doğum tarihi</span>
                <input
                  type="date"
                  max={todayStr}
                  style={sx.input}
                  value={profile.birthDate}
                  onChange={(e) => setProfile({ ...profile, birthDate: e.target.value })}
                />
              </label>

              {profileErr && <div style={sx.errorInline}><WarnIcon/>{profileErr}</div>}

              <div style={{ display: "flex", gap: 8 }}>
                <button type="submit" style={sx.primaryBtn} aria-busy={savingProfile}>
                  Değişiklikleri Kaydet
                </button>
              </div>
            </form>
          )}
        </div>
      </article>

      {/* My Courses & Enroll */}
      <div style={sx.twoCol}>
        {/* My Courses */}
        <article style={sx.card}>
          <h3 style={sx.cardTitle}>Derslerim</h3>

          {coursesErr && <div style={sx.errorInline}><WarnIcon/>{coursesErr}</div>}
          {loadingMyCourses ? (
            <ul style={sx.grid}>
              {Array.from({ length: 4 }).map((_, i) => <li key={i} style={sx.skeletonItem} />)}
            </ul>
          ) : myCourses.length === 0 ? (
            <div style={sx.emptyBox}>
              <div style={sx.emptyBadge}>Kayıt yok</div>
              <p style={{ margin: 0, color: "#6b7280" }}>
                Sağdaki formu kullanarak bir derse kaydol.
              </p>
            </div>
          ) : (
            <ul style={sx.grid}>
              {myCourses.map((c) => (
                <li key={c.id} style={sx.courseCard}>
                  <div style={sx.avatar}><b>{initialsFromName(c.name)}</b></div>
                  <div style={{ display: "grid", gap: 6 }}>
                    <strong style={{ fontSize: 16 }}>{c.name}</strong>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", color: "#6b7280", fontSize: 12 }}>
                      <IdIcon/> No #{c.id}
                    </div>
                  </div>
                  <button onClick={() => drop(c.id)} style={sx.dangerBtn} title="Dersi bırak">
                    Bırak
                  </button>
                </li>
              ))}
            </ul>
          )}
        </article>

        {/* Enroll New Course */}
        <article style={sx.card}>
          <h3 style={sx.cardTitle}>Yeni Derse Kayıt</h3>
          <div style={{ display: "grid", gap: 10 }}>
            <label style={sx.label}>
              <span>Uygun dersler</span>
              <select
                style={sx.input}
                value={enrollCourseId}
                onChange={(e) => setEnrollCourseId(e.target.value ? Number(e.target.value) : "")}
                disabled={loadingAllCourses}
              >
                <option value="">Bir ders seçin</option>
                {availableCourses.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </label>

            {enrollErr && <div style={sx.errorInline}><WarnIcon/>{enrollErr}</div>}

            <button
              style={sx.primaryBtn}
              onClick={enroll}
              disabled={!enrollCourseId}
              aria-busy={enrolling}
            >
              Kaydol
            </button>
          </div>
        </article>
      </div>
    </section>
  );
}

/** ---------- helpers ---------- */
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
function initialsFromName(name: string) {
  return name.split(" ").map((x) => x[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

/** ---------- styles ---------- */
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
  },
  title: { display: "flex", alignItems: "center", gap: 10, margin: 0, fontSize: 24 },
  dot: {
    width: 10, height: 10, borderRadius: 999, background: "#6a7cff",
    boxShadow: "0 0 0 6px rgba(106,124,255,0.18)", display: "inline-block",
  },
  subtitle: { margin: "6px 0 0", color: "#4b5563", fontSize: 14 },
  badge: { alignSelf: "center", fontSize: 13, padding: "6px 10px", borderRadius: 999, border: "1px solid #e5e7eb", background: "#fff" },

  card: {
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    background: "#fff",
    padding: 14,
    boxShadow: "0 1px 0 rgba(0,0,0,0.04), 0 16px 28px -22px rgba(0,0,0,0.15)",
  },
  cardTitle: { margin: "0 0 8px", fontSize: 18 },

  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 10,
  },
  label: { display: "grid", gap: 6, fontSize: 14 },
  input: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    background: "#fff",
    outline: "none",
  },
  primaryBtn: {
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
  dangerBtn: {
    marginLeft: "auto",
    border: "1px solid rgba(220,38,38,0.35)",
    background: "transparent",
    borderRadius: 12,
    padding: "8px 12px",
    cursor: "pointer",
    color: "#b91c1c",
    height: 36,
  },
  error: {
    display: "flex", alignItems: "center", gap: 8,
    border: "1px solid #fca5a5", background: "#fff1f2", color: "#b91c1c",
    padding: "8px 10px", borderRadius: 12,
  },
  errorInline: {
    display: "inline-flex", alignItems: "center", gap: 6,
    border: "1px solid #fca5a5", background: "#fff1f2", color: "#b91c1c",
    padding: "6px 8px", borderRadius: 10, fontSize: 13,
  },

  twoCol: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
  },

  // My courses list
  grid: {
    listStyle: "none",
    padding: 0,
    margin: 0,
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: 10,
  },
  courseCard: {
    display: "grid",
    gridTemplateColumns: "56px 1fr auto",
    alignItems: "center",
    gap: 12,
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    padding: 12,
  },
  avatar: {
    width: 56, height: 56, borderRadius: 14, display: "grid", placeItems: "center",
    background: "linear-gradient(135deg, rgba(106,124,255,0.22), #fff)",
    border: "1px solid #e5e7eb", color: "#0f172a",
  },

  skeleton: {
    height: 120,
    borderRadius: 16,
    border: "1px solid #e5e7eb",
    background: "linear-gradient(90deg, #f5f5f7 0%, #ececf0 50%, #f5f5f7 100%)",
    backgroundSize: "200% 100%",
    animation: "shimmer 1.2s linear infinite",
  },
  skeletonItem: {
    height: 72,
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    background: "linear-gradient(90deg, #f5f5f7 0%, #ececf0 50%, #f5f5f7 100%)",
    backgroundSize: "200% 100%",
    animation: "shimmer 1.2s linear infinite",
  },

  emptyBox: {
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

/** icons */
function WarnIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" aria-hidden="true">
      <path fill="currentColor" d="M10 2l9 16H1L10 2zm-1 6h2v4H9V8zm0 6h2v2H9v-2z" />
    </svg>
  );
}
function IdIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M3 4h18v16H3V4zm2 2v12h14V6H5zm2 2h6v2H7V8zm0 3h10v2H7v-2z" />
    </svg>
  );
}
