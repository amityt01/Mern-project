import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loadUser } from "./store/authSlice";
import Navbar from "./components/Navbar";
import AuthView from "./components/AuthView";
import ResourcesView from "./components/ResourcesView";
import FolderManager from "./components/FolderManager";
import AnalyticsDashboard from "./components/AnalyticsDashboard";
import "./App.css";

function App() {
  const dispatch = useDispatch();
  const { token, user, isLoading } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState("resources");
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    if (token) {
      dispatch(loadUser())
        .unwrap()
        .finally(() => setAuthChecked(true));
    } else {
      setAuthChecked(true);
    }
  }, [token, dispatch]);

  if (isLoading && !authChecked) {
    return (
      <div className="full-screen-loader">
        <div className="spinner"></div>
        <p>Loading EduReach Network...</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Navigation */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Core Router */}
      {!user ? (
        <AuthView />
      ) : (
        <main className="main-tab-content">
          {activeTab === "resources" && <ResourcesView />}
          {activeTab === "folders" && <FolderManager />}
          {activeTab === "analytics" && <AnalyticsDashboard />}
        </main>
      )}
    </div>
  );
}

export default App;