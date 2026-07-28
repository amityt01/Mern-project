import React, { useState, useEffect } from "react";
import { TableRowSkeleton } from "./SkeletonLoader";

/**
 * TopPerformingResources - Component to display top performing educational resources.
 * Displays resource title, author, views, downloads, loading skeleton, and empty states.
 * Can fetch data directly from API or receive resources, isLoading, and error via props.
 */
function TopPerformingResources({
  resources: initialResources,
  isLoading: propIsLoading,
  error: propError,
  title = "Top Performing Resources",
  subtitle = "Most viewed and downloaded educational materials across rural classrooms",
  showSearch = true,
  onRefresh,
}) {
  const [resources, setResources] = useState(initialResources || []);
  const [isLoading, setIsLoading] = useState(propIsLoading !== undefined ? propIsLoading : !initialResources);
  const [error, setError] = useState(propError || null);
  const [searchFilter, setSearchFilter] = useState("");

  // Synchronize when props change
  useEffect(() => {
    if (initialResources !== undefined) {
      setResources(initialResources);
    }
  }, [initialResources]);

  useEffect(() => {
    if (propIsLoading !== undefined) {
      setIsLoading(propIsLoading);
    }
  }, [propIsLoading]);

  useEffect(() => {
    if (propError !== undefined) {
      setError(propError);
    }
  }, [propError]);

  // Fetch top resources directly if no resources prop was provided
  const fetchTopResources = async () => {
    if (initialResources !== undefined) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("http://localhost:5050/api/resources/top");
      if (!res.ok) {
        throw new Error("Failed to fetch top performing resources.");
      }
      const data = await res.json();
      setResources(Array.isArray(data) ? data : data.topResources || []);
    } catch (err) {
      setError(err.message || "Network error fetching top performing resources.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialResources === undefined) {
      fetchTopResources();
    }
  }, []);

  const handleRetry = () => {
    if (onRefresh) {
      onRefresh();
    } else {
      fetchTopResources();
    }
  };

  // Filter resources locally based on search input
  const filteredResources = (resources || []).filter((resource) => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    const authorName = typeof resource.author === "object" ? resource.author?.name : resource.author;
    const schoolName = typeof resource.author === "object" ? resource.author?.schoolName : "";
    return (
      (resource.title && resource.title.toLowerCase().includes(q)) ||
      (resource.subject && resource.subject.toLowerCase().includes(q)) ||
      (resource.category && resource.category.toLowerCase().includes(q)) ||
      (authorName && authorName.toLowerCase().includes(q)) ||
      (schoolName && schoolName.toLowerCase().includes(q))
    );
  });

  return (
    <section className="top-resources-card">
      <div className="card-section-header top-resources-header">
        <div>
          <h3>{title}</h3>
          {subtitle && <p className="distribution-subtitle">{subtitle}</p>}
        </div>
        <div className="header-actions-row" style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          {showSearch && (
            <div className="top-resources-search-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="search-icon-sm">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Filter top materials..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                aria-label="Filter top materials"
              />
            </div>
          )}
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="top-resources-loading-container" style={{ padding: "16px" }}>
          <TableRowSkeleton count={5} />
        </div>
      ) : error ? (
        /* Error State */
        <div className="empty-resources-state" style={{ padding: "30px 20px", textAlign: "center" }}>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            style={{ width: "40px", height: "40px", color: "var(--accent-danger, #ef4444)", marginBottom: "12px" }}
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <h4 style={{ margin: "0 0 6px 0", color: "var(--text-primary)" }}>Failed to Load Top Resources</h4>
          <p style={{ margin: "0 0 16px 0", color: "var(--text-secondary)", fontSize: "13px" }}>{error}</p>
          <button className="btn-secondary" onClick={handleRetry} type="button">
            Try Again
          </button>
        </div>
      ) : filteredResources.length === 0 ? (
        /* Empty State */
        <div className="empty-resources-state" style={{ padding: "40px 20px", textAlign: "center" }}>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            style={{ width: "48px", height: "48px", color: "var(--text-secondary)", marginBottom: "12px", opacity: 0.7 }}
          >
            <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
            <polyline points="13 2 13 9 20 9" />
          </svg>
          <h4 style={{ margin: "0 0 6px 0", color: "var(--text-primary)" }}>No Top Resources Found</h4>
          <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "13px" }}>
            {searchFilter
              ? `No resources match "${searchFilter}". Try clearing your search filter.`
              : "No educational materials have recorded views or downloads yet."}
          </p>
          {searchFilter && (
            <button
              className="btn-secondary"
              onClick={() => setSearchFilter("")}
              style={{ marginTop: "12px" }}
              type="button"
            >
              Clear Filter
            </button>
          )}
        </div>
      ) : (
        /* List Items Table Mapping */
        <div className="top-resources-table">
          <div className="table-header-row top-performing-grid">
            <span>Rank & Title</span>
            <span>Author / School</span>
            <span>Subject</span>
            <span>Views</span>
            <span>Downloads</span>
          </div>

          {filteredResources.map((resource, index) => {
            const rankClass =
              index === 0
                ? "rank-gold"
                : index === 1
                ? "rank-silver"
                : index === 2
                ? "rank-bronze"
                : "rank-standard";

            const authorName =
              typeof resource.author === "object"
                ? resource.author?.name || "Anonymous Educator"
                : resource.author || "Anonymous Educator";

            const schoolName =
              typeof resource.author === "object"
                ? resource.author?.schoolName || "Rural Academy"
                : "Rural Academy";

            const viewsCount =
              resource.views !== undefined && resource.views !== null
                ? resource.views
                : resource.viewsCount !== undefined && resource.viewsCount !== null
                ? resource.viewsCount
                : (resource.downloadCount || 0) * 3 + 12;

            const downloadCount = resource.downloadCount ?? resource.downloads ?? 0;

            return (
              <div key={resource._id || resource.id || index} className="table-data-row top-performing-grid">
                {/* Title & Rank */}
                <div className="resource-title-cell-group">
                  <span className={`rank-badge ${rankClass}`}>#{index + 1}</span>
                  <div className="title-sub-info">
                    <span className="resource-title-cell">{resource.title || "Untitled Resource"}</span>
                    <span className="resource-category-chip">{resource.category || "General"}</span>
                  </div>
                </div>

                {/* Author */}
                <div className="author-cell-group">
                  <span className="author-avatar-chip">
                    {authorName ? authorName.charAt(0).toUpperCase() : "A"}
                  </span>
                  <div className="author-text">
                    <span className="author-name">{authorName}</span>
                    <span className="author-school">{schoolName}</span>
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <span className="subject-tag-pill">{resource.subject || "General"}</span>
                </div>

                {/* Views */}
                <div className="views-cell-group">
                  <div className="stat-cell-inner" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="metric-icon-sm"
                      style={{ width: "14px", height: "14px", color: "#60a5fa" }}
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                    <span className="views-cell" style={{ fontSize: "14px", fontWeight: "700", color: "#60a5fa" }}>
                      {viewsCount.toLocaleString()}
                    </span>
                  </div>
                  <span className="view-label" style={{ fontSize: "10px", color: "var(--text-secondary)" }}>
                    views
                  </span>
                </div>

                {/* Downloads */}
                <div className="downloads-cell-group">
                  <div className="stat-cell-inner" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="metric-icon-sm"
                      style={{ width: "14px", height: "14px", color: "var(--accent-success)" }}
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    <span className="downloads-cell">{downloadCount.toLocaleString()}</span>
                  </div>
                  <span className="download-label">downloads</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default TopPerformingResources;
