import { FolderItemSkeleton } from "./SkeletonLoader";

function FolderList({
  folders = [],
  activeFolder = null,
  onSelectFolder,
  onDeleteFolder,
  isLoading = false,
  error = null,
  onRetry = null,
  emptyMessage = "No folders found.",
  deletingFolderId = null,
  currentUserId = null,
  getFolderRole,
}) {
  if (isLoading) {
    return <FolderItemSkeleton count={3} />;
  }

  if (error) {
    return (
      <div className="folder-error-box">
        <p>{error}</p>
        {onRetry && (
          <button
            type="button"
            className="btn-retry btn-retry-sm"
            onClick={onRetry}
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  if (!folders || folders.length === 0) {
    return <p className="no-folders-text">{emptyMessage}</p>;
  }

  return (
    <div className="folders-list">
      {folders.map((folder) => {
        const isActive = activeFolder && activeFolder._id === folder._id;
        const role = getFolderRole ? getFolderRole(folder) : null;
        const isOwner =
          folder.owner?._id === currentUserId ||
          folder.owner === currentUserId;
        const isDeleting = deletingFolderId === folder._id;

        // Extract owner name
        let ownerName = null;
        if (folder.owner) {
          if (typeof folder.owner === "object") {
            ownerName = folder.owner.name || folder.owner.email || "Educator";
          } else {
            ownerName = "Educator";
          }
        }

        // Extract resource count
        const resourceCount = Array.isArray(folder.resources)
          ? folder.resources.length
          : 0;

        return (
          <div
            key={folder._id || folder.id}
            className={`folder-item ${isActive ? "active" : ""} ${
              isDeleting ? "folder-deleting" : ""
            }`}
            onClick={() => {
              if (!isDeleting && onSelectFolder) {
                onSelectFolder(folder);
              }
            }}
          >
            <div className="folder-icon-title">
              <svg
                className="folder-svg-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
              <div className="folder-item-details">
                <div className="folder-name-badge-row">
                  <h4>{folder.name}</h4>
                  {role && <span className="folder-role-badge">{role}</span>}
                </div>
                {folder.description && (
                  <p className="folder-item-desc">{folder.description}</p>
                )}
                {ownerName && (
                  <span className="folder-item-owner">
                    Owner: {ownerName}
                  </span>
                )}
              </div>
            </div>
            <div className="folder-item-meta">
              <span>
                {resourceCount} {resourceCount === 1 ? "item" : "items"}
              </span>
              {isOwner && onDeleteFolder && (
                <button
                  type="button"
                  className="btn-folder-delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteFolder(folder._id, folder.name, e);
                  }}
                  disabled={isDeleting}
                  title="Delete Folder"
                >
                  {isDeleting ? "..." : "×"}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default FolderList;
