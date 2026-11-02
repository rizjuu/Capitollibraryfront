import { Navigate, Outlet, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ allowedRoles, children }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    const roleRoute = user.role === "patron" ? "/patron" : "/login";

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
    return <Navigate to="/login" replace />;
  }

  return children ? children : <Outlet />;
}
