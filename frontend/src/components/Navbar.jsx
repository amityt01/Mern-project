import { useDispatch, useSelector } from "react-redux";
import { logoutUser } from "../store/authSlice";

function Navbar({ activeTab, setActiveTab }) {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out?")) {
      dispatch(logoutUser());
    }
  };

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
    </header>
  );
}

export default Navbar;
