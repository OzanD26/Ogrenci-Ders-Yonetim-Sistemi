import { useNavigate } from "react-router-dom";
import "./student-auth-choice.css";

export default function StudentAuthChoice() {
  const nav = useNavigate();

  return (
    <div className="sac-wrap">
      <main className="sac-main">
        <div className="sac-head">
          <h2>Öğrenci Erişimi</h2>
          <p>Devam etmek için bir seçenek seçin.</p>
        </div>

        <div className="sac-cards">
          <button
            className="sac-card sac-login"
            onClick={() => nav("/login-student")}
            aria-label="Giriş Yap"
          >
            <div className="sac-emoji">🔑</div>
            <div className="sac-body">
              <h3>Giriş Yap</h3>
              <p>Hesabınla oturum aç ve derslerine devam et.</p>
            </div>
            <span className="sac-cta">Devam et →</span>
          </button>

          <button
            className="sac-card sac-register"
            onClick={() => nav("/register-student")}
            aria-label="Kayıt Ol"
          >
            <div className="sac-emoji">📝</div>
            <div className="sac-body">
              <h3>Kayıt Ol</h3>
              <p>Yeni hesap oluştur ve derslere katıl.</p>
            </div>
            <span className="sac-cta">Devam et →</span>
          </button>
        </div>
      </main>

      <footer className="sac-foot">
        <small>© {new Date().getFullYear()} StudentCourse</small>
      </footer>
    </div>
  );
}
