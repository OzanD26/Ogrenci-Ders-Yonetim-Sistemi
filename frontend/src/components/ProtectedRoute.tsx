// src/components/ProtectedRoute.tsx
import { Navigate } from "react-router-dom";
import { getRole, isAuthed } from "../lib/auth";

export default function ProtectedRoute({
  roles,
  children,
}: {
  roles: Array<"ADMIN" | "STUDENT">;
  children: React.ReactNode;
}) {
  const authed = isAuthed();
  const role = getRole();

  // Giriş yapmamışsa -> gereken role'a göre doğru login sayfası
  if (!authed) {
    const target =
      roles?.includes("ADMIN") ? "/login-admin" :
      roles?.includes("STUDENT") ? "/login-student" : "/";
    return <Navigate to={target} replace />;
  }

  // Girişli ama yetkisi yoksa → rolüne uygun ana sayfaya veya landing'e
  if (role && roles && !roles.includes(role)) {
    const target = role === "ADMIN" ? "/admin/students" : "/student";
    return <Navigate to={target} replace />;
  }

  return <>{children}</>;
}
