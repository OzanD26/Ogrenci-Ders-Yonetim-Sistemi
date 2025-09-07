import { BrowserRouter, Routes, Route, NavLink, useNavigate, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";

/* Admin pages */
import AdminLogin from "./pages/AdminLogin";
import Students from "./pages/Students";
import Courses from "./pages/Courses";
import Enrollments from "./pages/Enrollments";

/* Public pages */
import StudentLogin from "./pages/StudentLogin";
import StudentRegister from "./pages/StudentRegister";
import StudentAuthChoice from "./pages/StudentAuthChoice";
import Landing from "./pages/Landing";

/* Student pages */
import StudentProfile from "./pages/StudentProfile";
import StudentMyCourses from "./pages/StudentMyCourses";
import StudentEnroll from "./pages/StudentEnroll";

/* auth utils */
import { getRole, isAuthed, logout } from "./lib/auth";

import "./App.css";

/* ================= NavBar ================= */
function NavBar() {
  const role = getRole();
  const authed = isAuthed();
  const nav = useNavigate();

  return (
    <nav style={sx.nav}>
      <div style={sx.navInner}>
        {/* Brand */}
        <div style={sx.brand}>
          <span style={sx.brandDot} aria-hidden="true" />
          <span style={sx.brandText}>Öğrenci Ders Yönetimi</span>
        </div>

        {/* Tabs */}
        <div style={sx.tabs} role="tablist" aria-label="Main navigation">
          {role === "ADMIN" && (
            <>
              <Tab to="/admin/students" icon={<UsersIcon />} label="Öğrenciler" />
              <Tab to="/admin/courses" icon={<BookIcon />} label="Dersler" />
              <Tab to="/admin/enrollments" icon={<LinkIcon />} label="Kayıtlar" />
            </>
          )}
          {role === "STUDENT" && (
            <>
              <Tab to="/student/profile" icon={<UsersIcon />} label="Profil" />
              <Tab to="/student/courses" icon={<BookIcon />} label="Derslerim" />
              <Tab to="/student/enroll" icon={<LinkIcon />} label="Kayıt" />
            </>
          )}
        </div>

        {/* Right */}
        <div style={sx.right}>
          {!authed ? (
            <>
              <TopBtn to="/" icon="🏠" text="Anasayfa" />
              <TopBtn to="/login-admin" text="Admin Girişi" />
              <TopBtn to="/student-auth" text="Öğrenci Girişi" />
            </>
          ) : (
            <button
              type="button"
              onClick={() => { logout(); nav("/"); }}
              style={{ ...sx.loginBtn, cursor: "pointer" }}
              title="Logout"
            >
              ⎋ <span>Çıkış</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}

/* Single tab item */
function Tab({ to, label, icon }: { to: string; label: string; icon: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      style={({ isActive }) => ({
        ...sx.tab,
        ...(isActive ? sx.tabActive : null),
      })}
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  );
}

/* Right-side buttons (Home/Admin/Student) */
function TopBtn({ to, text, icon }: { to: string; text: string; icon?: string }) {
  return (
    <NavLink
      to={to}
      style={({ isActive }) => ({ ...sx.loginBtn, ...(isActive ? sx.loginBtnActive : null) })}
    >
      {icon ? <span>{icon}</span> : null}
      <span>{text}</span>
    </NavLink>
  );
}

/* ================= App ================= */
export default function App() {
  const authed = isAuthed();
  const role = getRole();

  // Home yönlendirmesi: giriş yapmışsa rolüne göre
  const homeElement = authed
    ? <Navigate to={role === "ADMIN" ? "/admin/students" : "/student/profile"} replace />
    : <Landing />;

  return (
    <BrowserRouter>
      <NavBar />
      <main style={sx.main}>
        <Routes>
          {/* PUBLIC */}
          <Route path="/" element={homeElement} />
          <Route path="/student-auth" element={<StudentAuthChoice />} />
          <Route path="/login-admin" element={<AdminLogin />} />
          <Route path="/login-student" element={<StudentLogin />} />
          <Route path="/register-student" element={<StudentRegister />} />
          {/* Eski /login alias */}
          <Route path="/login" element={<Navigate to="/login-admin" replace />} />

          {/* ADMIN */}
          <Route
            path="/admin/students"
            element={<ProtectedRoute roles={["ADMIN"]}><Students /></ProtectedRoute>}
          />
          <Route
            path="/admin/courses"
            element={<ProtectedRoute roles={["ADMIN"]}><Courses /></ProtectedRoute>}
          />
          <Route
            path="/admin/enrollments"
            element={<ProtectedRoute roles={["ADMIN"]}><Enrollments /></ProtectedRoute>}
          />
          {/* /admin kökü -> students (BOŞ EKRANI ENGELLER) */}
          <Route path="/admin" element={<Navigate to="/admin/students" replace />} />

          {/* STUDENT */}
          <Route
            path="/student/profile"
            element={<ProtectedRoute roles={["STUDENT"]}><StudentProfile /></ProtectedRoute>}
          />
          <Route
            path="/student/courses"
            element={<ProtectedRoute roles={["STUDENT"]}><StudentMyCourses /></ProtectedRoute>}
          />
          <Route
            path="/student/enroll"
            element={<ProtectedRoute roles={["STUDENT"]}><StudentEnroll /></ProtectedRoute>}
          />
          {/* /student kökü -> profile */}
          <Route path="/student" element={<Navigate to="/student/profile" replace />} />

          {/* CATCH-ALL: Yanlış URL'leri toparla */}
          <Route
            path="*"
            element={
              isAuthed()
                ? <Navigate to={getRole() === "ADMIN" ? "/admin/students" : "/student/profile"} replace />
                : <Navigate to="/" replace />
            }
          />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

/* ================= Styles (DARK NAV) ================= */
const sx: Record<string, React.CSSProperties> = {
  nav: {
    position: "sticky",
    top: 0,
    zIndex: 40,
    background: "linear-gradient(180deg, rgba(13,16,22,.90), rgba(11,17,23,.92))",
    backdropFilter: "saturate(140%) blur(6px)",
    borderBottom: "1px solid #1b2433",
  },
  navInner: {
    display: "grid",
    gridTemplateColumns: "auto 1fr auto",
    alignItems: "center",
    gap: 12,
    padding: "8px 12px",
    maxWidth: 1200,
    margin: "0 auto",
  },
  brand: { display: "inline-flex", alignItems: "center", gap: 8 },
  brandDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    background: "#6a7cff",
    boxShadow: "0 0 0 6px rgba(106,124,255,0.18)",
  },
  brandText: { fontWeight: 800, letterSpacing: .3, color: "#e9edf4" },

  tabs: { display: "flex", gap: 6, overflowX: "auto", scrollbarWidth: "thin", padding: 2 },
  tab: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 12px",
    borderRadius: 12,
    border: "1px solid transparent",
    color: "#a7b3c9",
    textDecoration: "none",
    whiteSpace: "nowrap",
  },
  tabActive: {
    background: "#10161e",
    border: "1px solid #273246",
    boxShadow: "0 10px 24px rgba(0,0,0,.35)",
    color: "#e9edf4",
  },

  right: { display: "flex", alignItems: "center", gap: 8 },
  loginBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 12px",
    borderRadius: 12,
    border: "1px solid #273246",
    background: "#0c1218",
    color: "#e9edf4",
    textDecoration: "none",
  },
  loginBtnActive: {
    borderColor: "#6a7cff",
    boxShadow: "0 1px 0 rgba(106,124,255,0.18), 0 10px 22px -14px rgba(106,124,255,0.28)",
  },

  main: { maxWidth: 1200, margin: "0 auto", padding: 12 },
};

/* ================= Icons ================= */
function UsersIcon(){
  return(
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M16 11a4 4 0 1 0-4-4a4 4 0 0 0 4 4zM8 12a4 4 0 1 0-4-4a4 4 0 0 0 4 4zm0 2c-3.314 0-6 1.79-6 4v2h8v-2c0-1.2.53-2.27 1.41-3.11A7.9 7.9 0 0 0 8 14zm8 0c-1.49 0-2.84.33-3.99.89A5 5 0 0 1 14 18v2h8v-2c0-2.21-3.13-4-6-4z"/>
    </svg>
  );
}
function BookIcon(){
  return(
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M6 2h11a3 3 0 0 1 3 3v15a2 2 0 0 1-2 2H6a3 3 0 0 1-3-3V5a3 3 0 0 1 3-3zm1 4h12v12H7V6z"/>
    </svg>
  );
}
function LinkIcon(){
  return(
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M14 7h5a3 3 0 0 1 0 6h-5v-2h5a1 1 0 1 0 0-2h-5V7zM10 17H5a3 3 0 0 1 0-6h5v2H5a1 1 0 0 0 0 2h5v2zM8 11h8v2H8z"/>
    </svg>
  );
}
