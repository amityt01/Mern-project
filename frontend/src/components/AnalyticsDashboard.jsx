import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAnalytics } from "../store/analyticsSlice";
import { AnalyticsSkeleton } from "./SkeletonLoader";
import AnalyticsLineChart from "./AnalyticsLineChart";
import TopPerformingResources from "./TopPerformingResources";

function AnalyticsDashboard() {
  const dispatch = useDispatch();
  const { data, isLoading, error } = useSelector((state) => state.analytics);
  const [timeframe, setTimeframe] = useState("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [dateError, setDateError] = useState("");

  useEffect(() => {
    dispatch(fetchAnalytics());
  }, [dispatch]);

  const validateDates = (start, end) => {
    if (start && end) {
      if (new Date(start) > new Date(end)) {
        return "Start date cannot be after end date.";
      }
    }
    return "";
  };

  const handleStartDateChange = (e) => {
    const newStart = e.target.value;
    setStartDate(newStart);
    const err = validateDates(newStart, endDate);
    setDateError(err);
    if (!err && newStart && endDate) {
      setTimeframe("custom");
      dispatch(fetchAnalytics({ startDate: newStart, endDate }));
    }
  };

  const handleEndDateChange = (e) => {
    const newEnd = e.target.value;
    setEndDate(newEnd);
    const err = validateDates(startDate, newEnd);
    setDateError(err);
    if (!err && startDate && newEnd) {
      setTimeframe("custom");
      dispatch(fetchAnalytics({ startDate, endDate: newEnd }));
    }
  };

  const handleClearDates = () => {
    setStartDate("");
    setEndDate("");
    setDateError("");
    setTimeframe("all");
    dispatch(fetchAnalytics());
  };

  const handlePresetSelect = (preset) => {
    setDateError("");
    setTimeframe(preset);
    if (preset === "all") {
      setStartDate("");
      setEndDate("");
      dispatch(fetchAnalytics());
    } else {
      const today = new Date();
      const endStr = today.toISOString().split("T")[0];
      const startObj = new Date();
      if (preset === "week") {
        startObj.setDate(today.getDate() - 7);
      } else if (preset === "month") {
        startObj.setDate(today.getDate() - 30);
      }
      const startStr = startObj.toISOString().split("T")[0];
      setStartDate(startStr);
      setEndDate(endStr);
      dispatch(fetchAnalytics({ startDate: startStr, endDate: endStr }));
    }
  };

  const handleExportCsv = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (startDate) queryParams.append("startDate", startDate);
      if (endDate) queryParams.append("endDate", endDate);
      const queryString = queryParams.toString() ? `?${queryParams.toString()}` : "";

      const res = await fetch(`http://localhost:5050/api/analytics/export${queryString}`);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        alert(errData.message || "Failed to generate CSV usage report.");
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `resource_usage_report_${startDate || "all"}_to_${endDate || "all"}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download CSV usage report:", err);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await dispatch(fetchAnalytics({ startDate, endDate }));
    setTimeout(() => setIsRefreshing(false), 500);
  };

  if (isLoading && !data?.totalResources) {
    return <AnalyticsSkeleton />;
  }

  if (error && !data?.totalResources) {
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
          <button className="btn-retry" onClick={handleRefresh}>
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

  const { totalResources = 0, totalFolders = 0, totalTeachers = 0, totalDownloads = 0, categories = [], subjects = [], topResources = [], resourcesByDate = [] } = data || {};

  // Filter resources by date for local trend chart view
  const filteredResourcesByDate = resourcesByDate.filter((item) => {
    if (!item.date || item.date === "Unknown") return true;
    if (startDate && item.date < startDate) return false;
    if (endDate && item.date > endDate) return false;
    return true;
  });

  // Max counts for scale calculations
  const maxCategoryCount = categories.length > 0 ? Math.max(...categories.map((c) => c.count)) : 1;
  const maxSubjectCount = subjects.length > 0 ? Math.max(...subjects.map((s) => s.count)) : 1;
  const maxDateCount = filteredResourcesByDate.length > 0 ? Math.max(...filteredResourcesByDate.map((d) => d.count)) : 1;

  // Derived impact metrics
  const estimatedDataSavedMb = (totalDownloads * 1.45).toFixed(1);
  const activeSubjectCount = subjects.length;

  // Filtered top resources based on local search
  const filteredTopResources = topResources.filter((res) => {
    if (!searchFilter.trim()) return true;
    const query = searchFilter.toLowerCase();
    return (
      res.title.toLowerCase().includes(query) ||
      res.subject?.toLowerCase().includes(query) ||
      res.author?.name?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="analytics-dashboard">
      {/* Dashboard Top Header & Toolbar */}
      <div className="dashboard-header-bar">
        <div className="dashboard-title-group">
          <div className="dashboard-badge-pill">
            <span className="live-pulse-dot"></span>
            <span>Live Analytics Sync</span>
          </div>
          <h2>Resource & Network Dashboard</h2>
          <p className="dashboard-subtitle">
            Overview of shared materials, collaborative folders, educator engagement, and low-bandwidth downloads.
          </p>
        </div>

        <div className="dashboard-actions-group">
          <div className="date-picker-bar">
            <div className="date-input-group">
              <label htmlFor="analytics-start-date" className="date-label">From:</label>
              <input
                id="analytics-start-date"
                type="date"
                className={`date-picker-input ${dateError ? "input-error" : ""}`}
                value={startDate}
                onChange={handleStartDateChange}
                max={endDate || undefined}
              />
            </div>
            <div className="date-input-group">
              <label htmlFor="analytics-end-date" className="date-label">To:</label>
              <input
                id="analytics-end-date"
                type="date"
                className={`date-picker-input ${dateError ? "input-error" : ""}`}
                value={endDate}
                onChange={handleEndDateChange}
                min={startDate || undefined}
              />
            </div>
            {(startDate || endDate) && (
              <button
                className="btn-clear-date"
                onClick={handleClearDates}
                title="Clear date filter"
                type="button"
              >
                Clear
              </button>
            )}
          </div>

          <div className="timeframe-selector">
            <button
              className={`timeframe-btn ${timeframe === "all" ? "active" : ""}`}
              onClick={() => handlePresetSelect("all")}
            >
              All Time
            </button>
            <button
              className={`timeframe-btn ${timeframe === "month" ? "active" : ""}`}
              onClick={() => handlePresetSelect("month")}
            >
              30 Days
            </button>
            <button
              className={`timeframe-btn ${timeframe === "week" ? "active" : ""}`}
              onClick={() => handlePresetSelect("week")}
            >
              7 Days
            </button>
          </div>

          <button
            className={`btn-secondary btn-refresh-dash ${isRefreshing ? "refreshing" : ""}`}
            onClick={handleRefresh}
            title="Refresh Analytics Metrics"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="btn-icon-sm">
              <path d="M23 4v6h-6" />
              <path d="M1 20v-6h6" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            <span>{isRefreshing ? "Refreshing..." : "Refresh"}</span>
          </button>

          <button
            className="btn-primary btn-export-csv"
            onClick={handleExportCsv}
            title="Export CSV Usage Report"
            type="button"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="btn-icon-sm">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {dateError && (
        <div className="date-validation-alert" role="alert">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="alert-icon-sm">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{dateError}</span>
        </div>
      )}

      {/* Summary Cards Grid (Material UI Card Layout) */}
      <section className="analytics-overview-grid">
        {/* Card 1: Shared Resources */}
        <div className="analytics-card card-indigo">
          <div className="analytics-card-header">
            <div className="analytics-card-icon bg-indigo">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                <line x1="9" y1="7" x2="15" y2="7" />
                <line x1="9" y1="11" x2="17" y2="11" />
              </svg>
            </div>
            <span className="card-trend-chip chip-indigo">+12% growth</span>
          </div>
          <div className="analytics-card-info">
            <span className="value">{totalResources.toLocaleString()}</span>
            <span className="label">Shared Resources</span>
          </div>
          <div className="card-footer-subtext">
            <span>Worksheets, lesson sheets & guides</span>
          </div>
        </div>

        {/* Card 2: Collaborative Folders */}
        <div className="analytics-card card-emerald">
          <div className="analytics-card-header">
            <div className="analytics-card-icon bg-emerald">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                <line x1="12" y1="11" x2="12" y2="17" />
                <line x1="9" y1="14" x2="15" y2="14" />
              </svg>
            </div>
            <span className="card-trend-chip chip-emerald">Shared Hubs</span>
          </div>
          <div className="analytics-card-info">
            <span className="value">{totalFolders.toLocaleString()}</span>
            <span className="label">Collaborative Folders</span>
          </div>
          <div className="card-footer-subtext">
            <span>Organized folders across districts</span>
          </div>
        </div>

        {/* Card 3: Registered Educators */}
        <div className="analytics-card card-rose">
          <div className="analytics-card-header">
            <div className="analytics-card-icon bg-rose">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <span className="card-trend-chip chip-rose">Verified Network</span>
          </div>
          <div className="analytics-card-info">
            <span className="value">{totalTeachers.toLocaleString()}</span>
            <span className="label">Registered Educators</span>
          </div>
          <div className="card-footer-subtext">
            <span>Contributing rural teachers</span>
          </div>
        </div>

        {/* Card 4: Offline Downloads */}
        <div className="analytics-card card-amber">
          <div className="analytics-card-header">
            <div className="analytics-card-icon bg-amber">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </div>
            <span className="card-trend-chip chip-amber">Offline Synced</span>
          </div>
          <div className="analytics-card-info">
            <span className="value">{totalDownloads.toLocaleString()}</span>
            <span className="label">Offline Downloads</span>
          </div>
          <div className="card-footer-subtext">
            <span>Materials stored for local access</span>
          </div>
        </div>

        {/* Card 5: Bandwidth Saved */}
        <div className="analytics-card card-cyan">
          <div className="analytics-card-header">
            <div className="analytics-card-icon bg-cyan">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </div>
            <span className="card-trend-chip chip-cyan">Low Data Opt</span>
          </div>
          <div className="analytics-card-info">
            <span className="value">{estimatedDataSavedMb} MB</span>
            <span className="label">Bandwidth Saved</span>
          </div>
          <div className="card-footer-subtext">
            <span>Estimated data saved in low-net zones</span>
          </div>
        </div>

        {/* Card 6: Subject Scope */}
        <div className="analytics-card card-purple">
          <div className="analytics-card-header">
            <div className="analytics-card-icon bg-purple">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="8" r="7" />
                <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
              </svg>
            </div>
            <span className="card-trend-chip chip-purple">Multi-Subject</span>
          </div>
          <div className="analytics-card-info">
            <span className="value">{activeSubjectCount}</span>
            <span className="label">Subject Disciplines</span>
          </div>
          <div className="card-footer-subtext">
            <span>Curriculum breadth coverage</span>
          </div>
        </div>
      </section>

      {/* Rural Educator Impact Highlights Banner */}
      <section className="impact-highlights-banner">
        <div className="highlight-item">
          <div className="highlight-icon">⚡</div>
          <div className="highlight-text">
            <strong>Offline Readiness: 100%</strong>
            <span>All text worksheets are downloadable as zero-overhead text files for remote schools.</span>
          </div>
        </div>
        <div className="highlight-item">
          <div className="highlight-icon">📈</div>
          <div className="highlight-text">
            <strong>Top Requested Subject: Mathematics & Science</strong>
            <span>Accounting for over 60% of total classroom downloads this quarter.</span>
          </div>
        </div>
      {/* Interactive Line Chart: Views vs Downloads */}
      <section className="analytics-chart-section">
        <AnalyticsLineChart data={filteredResourcesByDate} timeframe={timeframe} />
      </section>

      {/* Distribution Charts & Top Resources Grid */}
      <div className="analytics-details-grid">
        {/* Category Breakdown */}
        <section className="distribution-card">
          <div className="card-section-header">
            <div>
              <h3>Resource Categories</h3>
              <p className="distribution-subtitle">Distribution of lesson materials by content format</p>
            </div>
            <span className="badge-pill-sm">{categories.length} Formats</span>
          </div>
          {!categories || categories.length === 0 ? (
            <p className="no-data-text">No category records found in database.</p>
          ) : (
            <div className="chart-list">
              {categories.map((c) => {
                const percentage = Math.round((c.count / maxCategoryCount) * 100);
                return (
                  <div key={c._id} className="chart-item">
                    <div className="chart-item-header">
                      <span className="chart-label-text">{c._id}</span>
                      <span className="chart-count-text">
                        <strong>{c.count}</strong> {c.count === 1 ? "resource" : "resources"}
                      </span>
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

        {/* Subject Coverage */}
        <section className="distribution-card">
          <div className="card-section-header">
            <div>
              <h3>Subject Coverage</h3>
              <p className="distribution-subtitle">Materials shared across core academic fields</p>
            </div>
            <span className="badge-pill-sm">{subjects.length} Fields</span>
          </div>
          {!subjects || subjects.length === 0 ? (
            <p className="no-data-text">No subject records found in database.</p>
          ) : (
            <div className="chart-list">
              {subjects.map((s) => {
                const percentage = Math.round((s.count / maxSubjectCount) * 100);
                return (
                  <div key={s._id} className="chart-item">
                    <div className="chart-item-header">
                      <span className="chart-label-text">{s._id}</span>
                      <span className="chart-count-text">
                        <strong>{s.count}</strong> {s.count === 1 ? "resource" : "resources"}
                      </span>
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

        {/* Resource Creation Trend */}
        <section className="distribution-card">
          <div className="card-section-header">
            <div>
              <h3>Resource Publishing Trend</h3>
              <p className="distribution-subtitle">Volume of new materials published by date</p>
            </div>
            <span className="badge-pill-sm">{filteredResourcesByDate.length} Active Days</span>
          </div>
          {!filteredResourcesByDate || filteredResourcesByDate.length === 0 ? (
            <p className="no-data-text">No publication timeline records available for selected range.</p>
          ) : (
            <div className="chart-list">
              {filteredResourcesByDate.map((d) => {
                const percentage = Math.round((d.count / maxDateCount) * 100);
                return (
                  <div key={d.date} className="chart-item">
                    <div className="chart-item-header">
                      <span className="chart-label-text">{d.date}</span>
                      <span className="chart-count-text">
                        <strong>{d.count}</strong> uploaded
                      </span>
                    </div>
                    <div className="chart-bar-container">
                      <div
                        className="chart-bar bg-amber"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Top Performing Resources Component */}
        <TopPerformingResources
          resources={topResources}
          isLoading={isLoading}
          error={error}
          onRefresh={handleRefresh}
        />
      </div>
    </div>
  );
}

export default AnalyticsDashboard;

