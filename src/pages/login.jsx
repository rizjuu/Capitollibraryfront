import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
    if (user.role === "patron") {
      navigate("/patron", { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        closeLogin();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Login form state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [signupFirstName, setSignupFirstName] = useState("");
  const [signupLastName, setSignupLastName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");
  const [signupStep, setSignupStep] = useState(1);
  const [signupCode, setSignupCode] = useState("");

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
      const response = await api.post("/auth/patron-login", {
        username,
        password
      });

      const { token, user: loggedUser } = response.data;
      login(loggedUser, token, true);
      navigate("/patron", { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Invalid username or password. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRequestSignupCode = async (e) => {
    if (e) e.preventDefault();
    setError("");
    setSuccessMessage("");
    setLoading(true);
    try {
      const response = await api.post("/auth/patron-register", {
        firstName: signupFirstName.trim(),
        lastName: signupLastName.trim(),
        email: signupEmail.trim()
      });
      setSignupCode("");
      setSignupStep(2);
      setSuccessMessage(response.data.message || "Verification code sent. Check your email.");
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Could not send a verification code. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError("");

    if (!signupFirstName.trim() || !signupLastName.trim()) {
      setError("Please enter your first and last name.");
      return;
    }

    if (signupPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (signupPassword !== signupConfirmPassword) {
      setError("Passwords do not match. Please re-enter your password.");
      return;
    }

    await handleRequestSignupCode();
  };

  const handleVerifySignupCode = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/auth/patron-register/verify", {
        email: signupEmail.trim(),
        code: signupCode.trim(),
        password: signupPassword
      });

      const { token, user: registeredUser } = response.data;
      login(registeredUser, token, true);
      navigate("/patron", { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Email verification failed. Please check the code and try again."
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
      aria-label={overlay ? (isSignUp ? "Library sign up" : "Library sign in") : undefined}
      onClick={overlay ? closeLogin : undefined}
    >
      <div className="login-modal" onClick={(event) => event.stopPropagation()}>
        <button
          type="button"
          className="login-close-button"
          onClick={closeLogin}
          aria-label={isSignUp ? "Close sign up" : "Close sign in"}
          title={isSignUp ? "Close sign up" : "Close sign in"}
        >
          <X size={20} />
        </button>

        <div className="login-card-brand">
          <img
            src="/logo.webp"
            alt="Misamis Oriental Provincial Capitol Public Library logo"
            className="login-card-logo"
          />
          <div className="login-card-brand-text">
            <span className="brand-sub">MISAMIS ORIENTAL</span>
            <strong className="brand-title">Provincial Capitol Public Library</strong>
          </div>
        </div>

        <div className="login-container">
          {!isForgotPassword ? (
            isSignUp ? (
              <>
                <h2 className="login-title">Create Patron Account</h2>
                <p className="login-description">
                  Sign up to access the library catalog and manage your loans. You can complete your patron profile after signing in.
                </p>

                {error && <div className="login-error" role="alert">{error}</div>}

                {signupStep === 1 ? (
                  <form onSubmit={handleSignUp}>
                    <label htmlFor="signup-first-name">First name</label>
                    <input
                      id="signup-first-name"
                      type="text"
                      placeholder="Enter your first name"
                      value={signupFirstName}
                      onChange={(e) => setSignupFirstName(e.target.value)}
                      autoComplete="given-name"
                      maxLength={80}
                      required
                      autoFocus
                    />

                    <label htmlFor="signup-last-name">Last name</label>
                    <input
                      id="signup-last-name"
                      type="text"
                      placeholder="Enter your last name"
                      value={signupLastName}
                      onChange={(e) => setSignupLastName(e.target.value)}
                      autoComplete="family-name"
                      maxLength={80}
                      required
                    />

                    <label htmlFor="signup-email">Email address</label>
                    <input
                      id="signup-email"
                      type="email"
                      placeholder="name@example.com"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      autoComplete="email"
                      maxLength={254}
                      required
                    />

                    <label htmlFor="signup-password">Password</label>
                    <div className="password-wrapper">
                      <input
                        id="signup-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="At least 8 characters"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        autoComplete="new-password"
                        maxLength={72}
                        minLength={8}
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
                    <p className="field-hint">Use 8–72 characters for your password.</p>

                    <label htmlFor="signup-confirm-password">Confirm password</label>
                    <input
                      id="signup-confirm-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Re-enter your password"
                      value={signupConfirmPassword}
                      onChange={(e) => setSignupConfirmPassword(e.target.value)}
                      autoComplete="new-password"
                      maxLength={72}
                      minLength={8}
                      required
                    />

                    <button
                      type="submit"
                      className="login-submit-btn full-width"
                      disabled={loading}
                    >
                      {loading ? "Sending code..." : "Continue with Email"}
                    </button>
                  </form>
                ) : (
                  <div className="signup-verification">
                    <p className="login-description">
                      Enter the 6-digit code sent to <strong>{signupEmail}</strong>. The code expires in 10 minutes.
                    </p>
                    {successMessage && <div className="login-success" role="status">{successMessage}</div>}
                    <form onSubmit={handleVerifySignupCode}>
                      <label htmlFor="signup-code">Email confirmation code</label>
                      <input
                        id="signup-code"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]{6}"
                        placeholder="Enter 6-digit code"
                        value={signupCode}
                        onChange={(e) => setSignupCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        autoComplete="one-time-code"
                        maxLength={6}
                        required
                        autoFocus
                      />
                      <button
                        type="submit"
                        className="login-submit-btn full-width"
                        disabled={loading || signupCode.length !== 6}
                      >
                        {loading ? "Verifying..." : "Confirm Email & Create Account"}
                      </button>
                    </form>
                    <div className="signup-verification-actions">
                      <button
                        type="button"
                        className="back-to-login-link"
                        onClick={() => {
                          setSignupStep(1);
                          setSignupCode("");
                          setError("");
                          setSuccessMessage("");
                        }}
                      >
                        Edit sign-up details
                      </button>
                      <button
                        type="button"
                        className="back-to-login-link"
                        onClick={handleRequestSignupCode}
                        disabled={loading}
                      >
                        Resend code
                      </button>
                    </div>
                  </div>
                )}

                {signupStep === 1 && (
                  <>
                    <p className="auth-switch">
                      Already have an account?{" "}
                      <button
                        type="button"
                        onClick={() => {
                          setIsSignUp(false);
                          setError("");
                          setSuccessMessage("");
                        }}
                      >
                        Sign in
                      </button>
                    </p>

                    <div className="login-divider">
                      <span>or sign up with Google</span>
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
                )}
              </>
            ) : (
              <>
                <h2 className="login-title">Patron Sign In</h2>
                <p className="login-description">
                  Access your patron account, borrow records, and catalog reservations.
                </p>

                {error && <div className="login-error" role="alert">{error}</div>}

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
                <p className="auth-switch">
                  New to the library?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUp(true);
                      setError("");
                    }}
                  >
                    Create an account
                  </button>
                </p>
              </>
            )
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
  );
}

export default Login;