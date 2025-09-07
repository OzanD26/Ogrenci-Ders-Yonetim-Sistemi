import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import client from "../api/client";
import { saveAuth } from "../lib/auth";
import "./student-login.css";

export default function StudentLogin() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(""); setBusy(true);
    try {
      const { data } = await client.post("/auth/login", { email, password });
      if (data?.user?.role !== "STUDENT") {
        setErr("Buradan yalnızca öğrenciler giriş yapabilir.");
      } else {
        saveAuth(data.token);
        nav("/student/profile");   // öğrenci anasayfası
      }
    } catch (e:any) {
      setErr(e?.response?.data?.message ?? "Giriş başarısız oldu");
    } finally { setBusy(false); }
  }

  return (
    <div className="sl-wrap">
      <main className="sl-main">
        <form className="sl-card" onSubmit={onSubmit}>
          <div className="sl-head">
            <h1>Hoş geldin Öğrenci</h1>
            <p>Devam etmek için öğrenci hesabınla giriş yap.</p>
          </div>

          {err && <div className="sl-error">{err}</div>}

          <label className="sl-field">
            <span>E-posta</span>
            <input
              value={email}
              onChange={e=>setEmail(e.target.value)}
              placeholder="ogrenci@ornek.com"
              autoComplete="username"
            />
          </label>

          <label className="sl-field">
            <span>Parola</span>
            <input
              type="password"
              value={password}
              onChange={e=>setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </label>
          
          <button className="sl-btn" disabled={busy} aria-busy={busy}>
            {busy ? "Giriş yapılıyor…" : "Giriş yap"}
          </button>

          <div className="sl-foot">
            Hesabın yok mu?{" "}
            <Link className="sl-link" to="/student/register">Kaydol</Link>
          </div>
        </form>
      </main>
    </div>
  );
}
