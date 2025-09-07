import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import client from "../api/client";
import { saveAuth } from "../lib/auth";
import "./student-register.css";

type Form = {
  email: string;
  firstName: string;
  lastName: string;
  birthDate: string; // yyyy-MM-dd
  password: string;
  confirm: string;
};

export default function StudentRegister() {
  const nav = useNavigate();
  const [f, setF] = useState<Form>({
    email: "",
    firstName: "",
    lastName: "",
    birthDate: "",
    password: "",
    confirm: "",
  });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;

  function validate(): string | null {
    if (!f.email.trim()) return "E-posta zorunludur.";
    if (!/^\S+@\S+\.\S+$/.test(f.email)) return "E-posta geçersiz.";
    if (!f.firstName.trim()) return "Ad zorunludur.";
    if (!f.lastName.trim()) return "Soyad zorunludur.";
    if (!f.birthDate) return "Doğum tarihi zorunludur.";
    const bd = new Date(f.birthDate + "T00:00:00");
    if (Number.isNaN(bd.getTime())) return "Doğum tarihi geçersiz.";
    const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    if (bd > t) return "Doğum tarihi gelecekte olamaz.";
    if (f.password.length < 6) return "Parola en az 6 karakter olmalıdır.";
    if (f.password !== f.confirm) return "Parolalar eşleşmiyor.";
    return null;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    const v = validate();
    if (v) { setErr(v); return; }
    setBusy(true);
    try {
      const { data } = await client.post("/auth/register", {
        email: f.email.trim(),
        password: f.password,
        firstName: f.firstName.trim(),
        lastName: f.lastName.trim(),
        birthDate: f.birthDate, // backend yyyy-MM-dd kabul ediyor
      });
      // başarılı: token + öğrenci rolü bekleniyor
      saveAuth(data.token);
      nav("/student/home");
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? e?.message ?? "Kayıt başarısız oldu";
      setErr(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="sr-wrap">
      <main className="sr-main">
        <form className="sr-card" onSubmit={onSubmit}>
          <div className="sr-head">
            <h1>Hesabını oluştur</h1>
            <p>Katıl ve derslere kaydolmaya başla.</p>
          </div>

          {err && <div className="sr-error">{err}</div>}

          <div className="sr-grid">
            <label className="sr-field">
              <span>E-posta</span>
              <input
                value={f.email}
                onChange={e=>setF({...f, email: e.target.value})}
                placeholder="ogrenci@ornek.com"
                autoComplete="email"
              />
            </label>

            <label className="sr-field">
              <span>Ad</span>
              <input
                value={f.firstName}
                onChange={e=>setF({...f, firstName: e.target.value})}
                placeholder="Adın"
                autoComplete="given-name"
              />
            </label>

            <label className="sr-field">
              <span>Soyad</span>
              <input
                value={f.lastName}
                onChange={e=>setF({...f, lastName: e.target.value})}
                placeholder="Soyadın"
                autoComplete="family-name"
              />
            </label>

            <label className="sr-field">
              <span>Doğum tarihi</span>
              <input
                type="date"
                max={todayStr}
                value={f.birthDate}
                onChange={e=>setF({...f, birthDate: e.target.value})}
              />
            </label>

            <label className="sr-field">
              <span>Parola</span>
              <input
                type="password"
                value={f.password}
                onChange={e=>setF({...f, password: e.target.value})}
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </label>

            <label className="sr-field">
              <span>Parolayı doğrula</span>
              <input
                type="password"
                value={f.confirm}
                onChange={e=>setF({...f, confirm: e.target.value})}
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </label>
          </div>

          <button className="sr-btn" disabled={busy} aria-busy={busy}>
            {busy ? "Hesap oluşturuluyor…" : "Kaydol"}
          </button>

          <div className="sr-foot">
            Zaten bir hesabın var mı?{" "}
            <Link className="sr-link" to="/student/login">Giriş yap</Link>
          </div>
        </form>
      </main>
    </div>
  );
}
