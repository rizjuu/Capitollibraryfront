import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import { X } from "lucide-react";
import "./Login.css";

function Login({ overlay = false }) {
  const navigate = useNavigate();
  const { user, login } = useAuth();

  const closeLogin = () => navigate("/", { replace: true });

  useEffect(() => {
    if (!user) return;
    const dashboardRoute =
      user.role === "admin"
        ? "/admin"
        : user.role === "staff"
          ? "/staff"
          : "/patron";
    navigate(dashboardRoute, { replace: true });
  }, [user, navigate]);

  // Login form state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Forgot password flow state
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1: request code, 2: reset password, 3: success
  const [forgotIdentifier, setForgotIdentifier] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/auth/login", {
        username,
        password
      });

      const { token, user: loggedUser } = response.data;
      login(loggedUser, token, true);

      if (loggedUser.role === "admin") {
        navigate("/admin", { replace: true });
      } else if (loggedUser.role === "staff") {
        navigate("/staff", { replace: true });
      } else {
        navigate("/patron", { replace: true });
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Authentication failed. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRequestResetCode = async (e) => {
    if (e) e.preventDefault();
    setError("");
    setSuccessMessage("");
    setLoading(true);

    try {
      const response = await api.post("/auth/forgot-password", {
        identifier: forgotIdentifier
      });

      let msg = response.data.message || "Verification code sent.";
      if (response.data.devCode) {
        msg += ` Code: ${response.data.devCode}`;
      }
      setSuccessMessage(msg);
      setForgotStep(2);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Failed to request password reset code. Please check your username/email."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match. Please re-enter.");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/auth/reset-password", {
        identifier: forgotIdentifier,
        code: resetCode,
        newPassword
      });

      setSuccessMessage(response.data.message || "Password successfully reset!");
      setForgotStep(3);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Failed to reset password. Please verify the code and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/auth/google-login", {
        credential: credentialResponse.credential
      });

      const { token, user: loggedUser } = response.data;
      login(loggedUser, token, true);
      navigate("/patron", { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Google sign-in failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError("Google sign-in was cancelled or failed. Please try again.");
  };

  return (
    <div
      className={`login-page${overlay ? " login-overlay" : ""}`}
      role={overlay ? "dialog" : undefined}
      aria-modal={overlay ? "true" : undefined}
      aria-label={overlay ? "Library sign in" : undefined}
      onClick={overlay ? closeLogin : undefined}
    >
      <div className="login-modal" onClick={(event) => event.stopPropagation()}>
        {/* Left Banner */}
        <div className="login-left">
        <Link to="/" className="library-brand-link">
          <div className="library-brand">
            <img
              src="/logo.webp"
              alt="Misamis Oriental Provincial Capitol Public Library logo"
              className="brand-icon"
            />
            <div>
              <small>MISAMIS ORIENTAL</small>
              <strong>Provincial Capitol Public Library</strong>
            </div>
          </div>
        </Link>

        <div className="hero-content">
          <h1>
            Knowledge,
            <br />
            <span>organized.</span>
          </h1>
          <p>
            Modern library management with passwordless patron access, barcode scanning,
            and SMS notifications — designed for your library.
          </p>
        </div>

        <div className="features">
          <div className="feature-card">
            <span>📖</span>
            <strong>12K+ Titles</strong>
          </div>
          <div className="feature-card">
            <span>▣</span>
            <strong>Barcode Ready</strong>
          </div>
          <div className="feature-card">
            <span>✉️</span>
            <strong>Gmail Login</strong>
          </div>
        </div>

        <div className="copyright">
          <Link to="/" style={{ color: "#DCC7AA", textDecoration: "underline", marginRight: "1rem" }}>
            ← Back to Landing Page
          </Link>
          © 2026 Misamis Oriental Provincial Capitol Public Library
        </div>
        </div>

        {/* Right Login Form */}
        <div className="login-right">
          {overlay && (
            <button
              type="button"
              className="login-close-button"
              onClick={closeLogin}
              aria-label="Close sign in"
              title="Close sign in"
            >
              <X size={20} />
            </button>
          )}
          <div className="login-container">
            {!isForgotPassword ? (
              <>
                <h2 className="login-title">User Login</h2>
                <p className="login-description">
                  Enter your library credentials to access your account.
                </p>

                {error && <div className="login-error">{error}</div>}

                <form onSubmit={handlePasswordLogin}>
                  <label htmlFor="login-username">Username</label>
                  <input
                    id="login-username"
                    type="text"
                    placeholder="Enter your username or email"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    autoFocus
                  />

                  <label htmlFor="login-password">Password</label>
                  <div className="password-wrapper">
                    <input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? "◉" : "◌"}
                    </button>
                  </div>

                  <div className="login-btn-row">
                    <button
                      type="submit"
                      className="login-submit-btn"
                      disabled={loading}
                    >
                      {loading ? "Logging in..." : "Login"}
                    </button>

                    <button
                      type="button"
                      className="forgot-password-link"
                      onClick={() => {
                        setIsForgotPassword(true);
                        setForgotStep(1);
                        setError("");
                        setSuccessMessage("");
                        setForgotIdentifier(username || "");
                      }}
                    >
                      Forgot password?
                    </button>
                  </div>
                </form>

                <div className="login-divider">
                  <span>or continue with Google</span>
                </div>

                <div className="google-button-wrapper">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    size="large"
                    width="380"
                    text="continue_with"
                    shape="rectangular"
                    logo_alignment="left"
                    theme="outline"
                  />
                </div>
              </>
            ) : (
              <div className="forgot-password-container">
                <h2 className="login-title">Reset Password</h2>
                <p className="login-description">
                  {forgotStep === 1
                    ? "Enter your registered username or email to receive a password reset verification code."
                    : forgotStep === 2
                      ? "Enter the 6-digit verification code sent to your account and choose a new password."
                      : "Your password has been successfully reset."}
                </p>

                {error && <div className="login-error">{error}</div>}
                {successMessage && <div className="login-success">{successMessage}</div>}

                {forgotStep === 1 && (
                  <form onSubmit={handleRequestResetCode}>
                    <label htmlFor="forgot-identifier">Username or Email</label>
                    <input
                      id="forgot-identifier"
                      type="text"
                      placeholder="Enter username or email address"
                      value={forgotIdentifier}
                      onChange={(e) => setForgotIdentifier(e.target.value)}
                      required
                      autoFocus
                    />

                    <div className="forgot-actions-row">
                      <button
                        type="submit"
                        className="login-submit-btn"
                        disabled={loading}
                      >
                        {loading ? "Sending..." : "Send Verification Code"}
                      </button>

                      <button
                        type="button"
                        className="back-to-login-link"
                        onClick={() => {
                          setIsForgotPassword(false);
                          setError("");
                          setSuccessMessage("");
                        }}
                      >
                        Back to Login
                      </button>
                    </div>
                  </form>
                )}

                {forgotStep === 2 && (
                  <form onSubmit={handleResetPassword}>
                    <label htmlFor="reset-code">6-Digit Verification Code</label>
                    <input
                      id="reset-code"
                      type="text"
                      placeholder="e.g. 482910"
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value.trim())}
                      maxLength={6}
                      required
                      autoFocus
                    />

                    <label htmlFor="new-password">New Password</label>
                    <div className="password-wrapper">
                      <input
                        id="new-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="At least 6 characters"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? "◉" : "◌"}
                      </button>
                    </div>

                    <label htmlFor="confirm-password">Confirm New Password</label>
                    <input
                      id="confirm-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Re-type new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />

                    <div className="forgot-actions-row">
                      <button
                        type="submit"
                        className="login-submit-btn"
                        disabled={loading}
                      >
                        {loading ? "Saving..." : "Update Password"}
                      </button>

                      <button
                        type="button"
                        className="back-to-login-link"
                        onClick={() => {
                          setIsForgotPassword(false);
                          setForgotStep(1);
                          setError("");
                          setSuccessMessage("");
                        }}
                      >
                        Back to Login
                      </button>
                    </div>

                    <div className="resend-container">
                      <button
                        type="button"
                        className="resend-code-btn"
                        onClick={handleRequestResetCode}
                        disabled={loading}
                      >
                        Didn't receive code? Resend
                      </button>
                    </div>
                  </form>
                )}

                {forgotStep === 3 && (
                  <div className="reset-success-card">
                    <button
                      type="button"
                      className="login-submit-btn"
                      style={{ width: "100%", marginTop: "16px" }}
                      onClick={() => {
                        setIsForgotPassword(false);
                        setForgotStep(1);
                        setError("");
                        setSuccessMessage("");
                      }}
                    >
                      Back to Sign In
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;