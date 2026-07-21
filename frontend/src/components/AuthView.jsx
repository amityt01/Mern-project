import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loginUser, registerUser, clearAuthError } from "../store/authSlice";

function AuthView() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showJwtDetails, setShowJwtDetails] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    schoolName: "",
  });

  const dispatch = useDispatch();
  const { isLoading, error } = useSelector((state) => state.auth);

  const [validationError, setValidationError] = useState("");

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  useEffect(() => {
    // Clear errors when toggling modes
    dispatch(clearAuthError());
    setValidationError("");
  }, [isLogin, dispatch]);

  const handleChange = (e) => {
    setValidationError("");
    if (error) dispatch(clearAuthError());
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleQuickFill = (email, password, name = "", schoolName = "") => {
    setValidationError("");
    dispatch(clearAuthError());
    setFormData({
      email,
      password,
      name,
      schoolName,
    });
    if (isLogin) {
      dispatch(loginUser({ email, password }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setValidationError("");
    dispatch(clearAuthError());

    if (!EMAIL_REGEX.test(formData.email.trim())) {
      setValidationError("Please enter a valid email address (e.g. teacher@school.org).");
      return;
    }

    if (formData.password.length < 6) {
      setValidationError("Password must be at least 6 characters long.");
      return;
    }

    if (isLogin) {
      dispatch(loginUser({ email: formData.email.trim(), password: formData.password }));
    } else {
      dispatch(registerUser({ ...formData, email: formData.email.trim() }));
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        {/* Top Header */}
        <div className="auth-header">
          <div className="auth-brand-logo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <h2>{isLogin ? "Teacher Authentication" : "Teacher Registry"}</h2>
          <p>
            {isLogin
              ? "Authenticate with email and password to receive your JWT session token"
              : "Register as an educator to share resources across rural communities"}
          </p>
        </div>

        {/* Mode Switcher Pills */}
        <div className="auth-mode-tabs">
          <button
            type="button"
            className={`auth-mode-btn ${isLogin ? "active" : ""}`}
            onClick={() => setIsLogin(true)}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`auth-mode-btn ${!isLogin ? "active" : ""}`}
            onClick={() => setIsLogin(false)}
          >
            Create Account
          </button>
        </div>

        {(validationError || error) && (
          <div className="auth-error-banner" role="alert">
            <div className="auth-error-content">
              <svg className="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{validationError || error}</span>
            </div>
            <button
              type="button"
              className="error-dismiss-btn"
              onClick={() => {
                setValidationError("");
                dispatch(clearAuthError());
              }}
              title="Dismiss error message"
            >
              &times;
            </button>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                placeholder="e.g. Dr. Sarah Jenkins"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Teacher Email Address</label>
            <div className="input-with-icon">
              <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="teacher@school.org"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">
              Password <small style={{ opacity: 0.7, fontWeight: 400 }}>(min. 6 characters)</small>
            </label>
            <div className="input-with-icon password-input-wrapper">
              <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                minLength={6}
                required
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? "Hide password" : "Show password"}
                tabIndex="-1"
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {!isLogin && (
            <div className="form-group">
              <label htmlFor="schoolName">School Name</label>
              <div className="input-with-icon">
                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                  <path d="M6 12v5c3 3 9 3 12 0v-5" />
                </svg>
                <input
                  type="text"
                  id="schoolName"
                  name="schoolName"
                  placeholder="e.g. Pine Ridge Rural School"
                  value={formData.schoolName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          )}

          <button type="submit" className="btn-primary auth-submit-btn" disabled={isLoading}>
            {isLoading ? (
              <span className="auth-spinner"></span>
            ) : isLogin ? (
              "Sign In & Obtain JWT Token"
            ) : (
              "Register & Initialize Session"
            )}
          </button>
        </form>

        {/* Demo Accounts Quick Login Bar */}
        {isLogin && (
          <div className="quick-login-section">
            <div className="quick-login-title">
              <span>⚡ Quick Demo Credentials</span>
            </div>
            <div className="quick-login-buttons">
              <button
                type="button"
                className="quick-demo-btn"
                onClick={() => handleQuickFill("teacher@test.com", "password123")}
              >
                <span>Demo Teacher</span>
                <small>teacher@test.com</small>
              </button>
              <button
                type="button"
                className="quick-demo-btn"
                onClick={() => handleQuickFill("sarah.j@school.org", "password123")}
              >
                <span>Sarah Jenkins</span>
                <small>sarah.j@school.org</small>
              </button>
            </div>
          </div>
        )}

        {/* JWT & Session Management Info Banner */}
        <div className="jwt-info-box">
          <div className="jwt-info-header" onClick={() => setShowJwtDetails(!showJwtDetails)}>
            <div className="jwt-badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span>JWT Bearer Auth Protocol</span>
            </div>
            <button type="button" className="jwt-toggle-link">
              {showJwtDetails ? "Hide specs ▲" : "How sessions work ▼"}
            </button>
          </div>

          {showJwtDetails && (
            <div className="jwt-details-content">
              <p>Upon successful authentication, the server generates an HMAC-SHA256 signed JWT string:</p>
              <code>Header.Payload.Signature</code>
              <ul>
                <li>🔐 Saved in <code>localStorage</code> for persistent browser session state.</li>
                <li>📡 Included as <code>Authorization: Bearer &lt;token&gt;</code> on API calls.</li>
                <li>Verified on backend via custom Express middleware.</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AuthView;

