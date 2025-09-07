import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import client from "../api/client";
import { saveAuth } from "../lib/auth";
import "./admin-login-neo.css";
import "./admin-login.css";

export default function AdminLogin() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(""); setBusy(true);
    try {
      const { data } = await client.post("/auth/login", { email, password });
      if (data?.user?.role !== "ADMIN") {
        setErr("Buradan yalnızca yöneticiler giriş yapabilir.");
      } else {
        saveAuth(data.token);
        nav("/admin");
      }
    } catch (e:any) {
      setErr(e?.response?.data?.message ?? "Giriş başarısız oldu");
    } finally { setBusy(false); }
  }

  return (
    <div className="al2-wrap">
      <main className="al2-main">
        <form className="al2-card" onSubmit={onSubmit}>
          <div className="al2-head">
            <h1>Giriş yap</h1>
            <p>Devam etmek için yönetici bilgilerinizi kullanın.</p>
          </div>

          {err && <div className="al2-error">{err}</div>}

          <label className="al2-field">
            <span>E-posta</span>
            <input
              value={email}
              onChange={e=>setEmail(e.target.value)}
              placeholder="eposta@ornek.com"
              autoComplete="username"
            />
          </label>

          <label className="al2-field">
            <span>Parola</span>
            <input
              type="password"
              value={password}
              onChange={e=>setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </label>

          <div className="al2-row">
            <label className="al2-remember">
              <input type="checkbox" checked={remember} onChange={e=>setRemember(e.target.checked)} />
              <span>Beni hatırla</span>
            </label>
          </div>

          <button className="al2-btn" disabled={busy} aria-busy={busy}>
            {busy ? "Giriş yapılıyor…" : "Giriş yap"}
          </button>
        </form>
      </main>
    </div>
  );
}
