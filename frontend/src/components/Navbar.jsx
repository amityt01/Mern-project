import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { logoutUser } from "../store/authSlice";

function Navbar({ activeTab, setActiveTab }) {
  const dispatch = useDispatch();
  const { user, token } = useSelector((state) => state.auth);
  const [showJwtModal, setShowJwtModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out of your session?")) {
      dispatch(logoutUser());
    }
  };

  const handleCopyToken = () => {
    if (token) {
      navigator.clipboard.writeText(token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const parseJwt = (tokenStr) => {
    try {
      const parts = tokenStr.split(".");
      if (parts.length !== 3) return null;
      const base64Url = parts[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  };

  const decodedPayload = token ? parseJwt(token) : null;

  return (
    <header className="app-header">
      <div className="brand">
        <svg className="brand-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
        <div className="brand-text">
          <h1>EduReach</h1>
          <span>Rural Resource Exchange</span>
        </div>
      </div>

      {user && (
        <nav className="nav-tabs">
          <button
            className={`nav-tab-btn ${activeTab === "resources" ? "active" : ""}`}
            onClick={() => setActiveTab("resources")}
          >
            Resources
          </button>
          <button
            className={`nav-tab-btn ${activeTab === "folders" ? "active" : ""}`}
            onClick={() => setActiveTab("folders")}
          >
            Collaborative Folders
          </button>
          <button
            className={`nav-tab-btn ${activeTab === "analytics" ? "active" : ""}`}
            onClick={() => setActiveTab("analytics")}
          >
            Analytics Dashboard
          </button>
        </nav>
      )}

      {user && (
        <div className="user-profile-menu">
          <button
            className="jwt-session-badge"
            onClick={() => setShowJwtModal(true)}
            title="View Active JWT Session Token"
          >
            <span className="jwt-dot"></span>
            <span>JWT Active</span>
          </button>

          <div className="user-meta">
            <span className="user-name">{user.name}</span>
            <span className="user-school">{user.schoolName}</span>
          </div>

          <button className="btn-logout" onClick={handleLogout} title="Log Out">
            <svg className="logout-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      )}

      {/* JWT Session Details Modal */}
      {showJwtModal && (
        <div className="modal-overlay" onClick={() => setShowJwtModal(false)}>
          <div className="modal-content form-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🔑 Active JWT Session Token</h3>
              <button className="modal-close-btn" onClick={() => setShowJwtModal(false)}>
                &times;
              </button>
            </div>
            <p className="modal-subtitle">
              This JSON Web Token was issued by the backend upon teacher authentication and is used for session management.
            </p>

            <div className="jwt-inspector">
              <div className="jwt-field-group">
                <label>Raw Bearer Token:</label>
                <div className="token-display-box">
                  <textarea readOnly value={token || ""} rows={3} />
                  <button className="btn-secondary copy-token-btn" onClick={handleCopyToken}>
                    {copied ? "Copied! ✓" : "Copy Token"}
                  </button>
                </div>
              </div>

              {decodedPayload && (
                <div className="jwt-field-group">
                  <label>Decoded JWT Claims (Payload):</label>
                  <pre className="jwt-json-box">
                    {JSON.stringify(decodedPayload, null, 2)}
                  </pre>
                </div>
              )}

              <div className="jwt-status-callout">
                <span className="status-label">Session Storage:</span>
                <code>localStorage.setItem('token', ...)</code>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export default Navbar;

