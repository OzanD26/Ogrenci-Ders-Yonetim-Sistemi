import { useNavigate } from "react-router-dom";
import "./landing.css";

export default function Landing() {
  const nav = useNavigate();

  return (
    <div className="ld-wrap">
   

      {/* hero alanı */}
      <main className="ld-hero container">
        <div className="ld-text">
          <h1>Hoşgeldin</h1>
          <p>Devam etmek için rolünü seç.</p>
        </div>

        <div className="ld-cards">
          {/* Admin */}
          <button
            className="ld-card ld-admin"
            onClick={() => nav("/login-admin")}
            aria-label="Admin olarak devam et"
          >
            <div className="ld-emoji">🔐</div>
            <div className="ld-card-body">
              <h3>Admin</h3>
              <p>Yönetim paneli, kullanıcılar ve dersler.</p>
            </div>
            <span className="ld-cta">Devam et →</span>
          </button>

          {/* Student */}
          <button
            className="ld-card ld-student"
            onClick={() => nav("/student-auth")}
            aria-label="Öğrenci olarak devam et"
          >
            <div className="ld-emoji">🎓</div>
            <div className="ld-card-body">
              <h3>Öğrenci</h3>
              <p>Derslere katıl, profili düzenle, kayıt ol.</p>
            </div>
            <span className="ld-cta">Devam et →</span>
          </button>
        </div>
      </main>

      {/* dip bilgi */}
      <footer className="ld-foot">
        <small>© {new Date().getFullYear()} StudentCourse • Built with React + Express</small>
      </footer>
    </div>
  );
}
