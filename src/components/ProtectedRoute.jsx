import { Navigate, Outlet, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ allowedRoles, children }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    const roleRoute =
      user.role === "admin"
        ? "/admin"
        : user.role === "staff"
          ? "/staff"
          : user.role === "patron"
            ? "/patron"
            : "/login";

    const blockBackNavigation = () => {
      window.history.pushState(null, "", roleRoute);
      navigate(roleRoute, { replace: true });
    };

    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", blockBackNavigation);

    return () => {
      window.removeEventListener("popstate", blockBackNavigation);
    };
  }, [user, navigate]);

  if (loading) {
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "var(--bg-base, #FAF7F2)",
        color: "var(--text-primary, #4B3832)",
        fontFamily: "var(--font-sans, sans-serif)"
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            fontSize: "24px",
            marginBottom: "12px",
            animation: "spin 1s linear infinite"
          }}>
            📚
          </div>
          <p style={{ fontWeight: 600, color: "var(--text-muted, #8C7768)" }}>Loading session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect user to their own role dashboard if trying to access unauthorized route
    if (user.role === "admin") return <Navigate to="/admin" replace />;
    if (user.role === "staff") return <Navigate to="/staff" replace />;
    if (user.role === "patron") return <Navigate to="/patron" replace />;
    return <Navigate to="/login" replace />;
  }

  return children ? children : <Outlet />;
}
