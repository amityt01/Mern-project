import React from "react";

export function ResourceCardSkeleton({ count = 6 }) {
  return (
    <div className="resources-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="resource-card skeleton-card">
          <div className="skeleton-line skeleton-badge-group">
            <div className="skeleton-pill skeleton-category" />
            <div className="skeleton-pill skeleton-grade" />
          </div>
          <div className="skeleton-line skeleton-title" />
          <div className="skeleton-line skeleton-desc-1" />
          <div className="skeleton-line skeleton-desc-2" />
          <div className="skeleton-author-row">
            <div className="skeleton-avatar" />
            <div className="skeleton-author-text">
              <div className="skeleton-line skeleton-name" />
              <div className="skeleton-line skeleton-school" />
            </div>
          </div>
          <div className="skeleton-footer">
            <div className="skeleton-pill skeleton-subject" />
            <div className="skeleton-pill skeleton-downloads" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function FolderItemSkeleton({ count = 4 }) {
  return (
    <div className="folders-skeleton-list">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="folder-item skeleton-folder-item">
          <div className="skeleton-icon" />
          <div className="skeleton-folder-info">
            <div className="skeleton-line skeleton-folder-title" />
            <div className="skeleton-line skeleton-folder-sub" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function AnalyticsSkeleton() {
  return (
    <div className="analytics-dashboard">
      <div className="analytics-overview-grid">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="analytics-card skeleton-card">
            <div className="skeleton-icon-lg" />
            <div className="skeleton-info">
              <div className="skeleton-line skeleton-stat-num" />
              <div className="skeleton-line skeleton-stat-label" />
            </div>
          </div>
        ))}
      </div>
      <div className="analytics-details-grid">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="distribution-card skeleton-card">
            <div className="skeleton-line skeleton-chart-title" />
            <div className="skeleton-line skeleton-chart-sub" />
            <div className="skeleton-bars">
              <div className="skeleton-line skeleton-bar" />
              <div className="skeleton-line skeleton-bar" />
              <div className="skeleton-line skeleton-bar" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TableRowSkeleton({ count = 3 }) {
  return (
    <div className="table-skeleton-rows">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="table-data-row skeleton-table-row">
          <div className="skeleton-line skeleton-cell-lg" />
          <div className="skeleton-line skeleton-cell-md" />
          <div className="skeleton-line skeleton-cell-md" />
          <div className="skeleton-line skeleton-cell-sm" />
          <div className="skeleton-line skeleton-cell-sm" />
        </div>
      ))}
    </div>
  );
}
