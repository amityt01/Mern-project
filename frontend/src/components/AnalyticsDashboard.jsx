import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAnalytics } from "../store/analyticsSlice";
import { AnalyticsSkeleton } from "./SkeletonLoader";

function AnalyticsDashboard() {
  const dispatch = useDispatch();
  const { data, isLoading, error } = useSelector((state) => state.analytics);

  useEffect(() => {
    dispatch(fetchAnalytics());
  }, [dispatch]);

  if (isLoading) {
    return <AnalyticsSkeleton />;
  }

  if (error) {
    return (
      <div className="analytics-error-wrapper">
        <div className="error-container" role="alert">
          <svg className="error-container-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <h3>Analytics Engine Unavailable</h3>
          <p>{error}</p>
          <button className="btn-retry" onClick={() => dispatch(fetchAnalytics())}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="btn-icon-sm">
              <path d="M23 4v6h-6" />
              <path d="M1 20v-6h6" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            Retry Analytics Engine
          </button>
        </div>
      </div>
    );
  }

  const { totalResources, totalFolders, totalTeachers, totalDownloads, categories, subjects, topResources } = data || {};

  // Max counts for scale calculations
  const maxCategoryCount = categories && categories.length > 0 ? Math.max(...categories.map((c) => c.count)) : 1;
  const maxSubjectCount = subjects && subjects.length > 0 ? Math.max(...subjects.map((s) => s.count)) : 1;

  return (
    <div className="analytics-dashboard">
      {/* Overview Cards */}
      <section className="analytics-overview-grid">
        <div className="analytics-card">
          <div className="analytics-card-icon bg-indigo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </div>
          <div className="analytics-card-info">
            <span className="value">{totalResources || 0}</span>
            <span className="label">Shared Resources</span>
          </div>
        </div>

        <div className="analytics-card">
          <div className="analytics-card-icon bg-emerald">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <div className="analytics-card-info">
            <span className="value">{totalFolders || 0}</span>
            <span className="label">Collaborative Folders</span>
          </div>
        </div>

        <div className="analytics-card">
          <div className="analytics-card-icon bg-rose">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div className="analytics-card-info">
            <span className="value">{totalTeachers || 0}</span>
            <span className="label">Registered Educators</span>
          </div>
        </div>

        <div className="analytics-card">
          <div className="analytics-card-icon bg-amber">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </div>
          <div className="analytics-card-info">
            <span className="value">{totalDownloads || 0}</span>
            <span className="label">Offline Downloads</span>
          </div>
        </div>
      </section>

      {/* Distribution Charts & Top Resources */}
      <div className="analytics-details-grid">
        {/* Category Breakdown */}
        <section className="distribution-card">
          <h3>Resource Categories</h3>
          <p className="distribution-subtitle">Distribution of lesson sheets by format</p>
          {!categories || categories.length === 0 ? (
            <p className="no-data-text">No category data available.</p>
          ) : (
            <div className="chart-list">
              {categories.map((c) => {
                const percentage = Math.round((c.count / maxCategoryCount) * 100);
                return (
                  <div key={c._id} className="chart-item">
                    <div className="chart-item-header">
                      <span>{c._id}</span>
                      <span><strong>{c.count}</strong> items</span>
                    </div>
                    <div className="chart-bar-container">
                      <div
                        className="chart-bar bg-indigo"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Subject Breakdown */}
        <section className="distribution-card">
          <h3>Subject Coverage</h3>
          <p className="distribution-subtitle">Materials shared across academic fields</p>
          {!subjects || subjects.length === 0 ? (
            <p className="no-data-text">No subject data available.</p>
          ) : (
            <div className="chart-list">
              {subjects.map((s) => {
                const percentage = Math.round((s.count / maxSubjectCount) * 100);
                return (
                  <div key={s._id} className="chart-item">
                    <div className="chart-item-header">
                      <span>{s._id}</span>
                      <span><strong>{s.count}</strong> items</span>
                    </div>
                    <div className="chart-bar-container">
                      <div
                        className="chart-bar bg-emerald"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Top Downloaded Resources */}
        <section className="top-resources-card">
          <h3>Top Downloaded Resources</h3>
          <p className="distribution-subtitle">Most utilized worksheets and study materials</p>
          {!topResources || topResources.length === 0 ? (
            <p className="no-data-text">No download records found.</p>
          ) : (
            <div className="top-resources-table">
              <div className="table-header-row">
                <span>Resource Title</span>
                <span>Author</span>
                <span>Subject</span>
                <span>Downloads</span>
              </div>
              {topResources.map((resource) => (
                <div key={resource._id} className="table-data-row">
                  <span className="resource-title-cell">{resource.title}</span>
                  <span>{resource.author?.name || "Anonymous"}</span>
                  <span>{resource.subject}</span>
                  <span className="downloads-cell">{resource.downloadCount}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default AnalyticsDashboard;
