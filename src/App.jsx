import { lazy, Suspense } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate
} from "react-router-dom";
import "./App.css";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Landing from "./pages/Landing";
import Login from "./pages/login";

// Code-split patron dashboard to keep initial landing bundle minimal
const PatronDashboard = lazy(() => import("./pages/PatronDashboard"));

function PageLoadingFallback() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#FAF6EE",
        color: "#4B3832",
        fontFamily: "system-ui, sans-serif",
        gap: "12px"
      }}
    >
      <div
        style={{
          width: "36px",
          height: "36px",
          border: "3px solid #DCC7AA",
          borderTopColor: "#4B3832",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite"
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <span style={{ fontSize: "14px", fontWeight: 500, opacity: 0.85 }}>
        Loading dashboard...
      </span>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Landing Page seen FIRST before login page */}
          <Route path="/" element={<Landing />} />

          {/* Login Page with Admin, Staff, and Patron Gmail tabs */}
          <Route
            path="/login"
            element={
              <>
                <Landing />
                <Login overlay />
              </>
            }
          />

          {/* Protected Patron Dashboard / Home */}
          <Route
            path="/patron"
            element={
              <ProtectedRoute allowedRoles={["patron"]}>
                <Suspense fallback={<PageLoadingFallback />}>
                  <PatronDashboard />
                </Suspense>
              </ProtectedRoute>
            }
          />

          {/* Catch-all redirect to Landing Page */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;