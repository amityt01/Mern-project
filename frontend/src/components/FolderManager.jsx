import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchFolders,
  fetchSharedFolders,
  createFolder,
  deleteFolder,
  shareFolder,
  removeResourceFromFolder,
  clearFolderError,
} from "../store/folderSlice";
import { addToast } from "../store/toastSlice";
import { FolderItemSkeleton, TableRowSkeleton } from "./SkeletonLoader";

function FolderManager() {
  const dispatch = useDispatch();
  const {
    folders,
    sharedFolders,
    isLoading,
    isLoadingShared,
    isCreating,
    isSharing,
    deletingFolderId,
    removingResourceId,
    error,
    sharedError,
  } = useSelector((state) => state.folders);
  const { user } = useSelector((state) => state.auth);

  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderDesc, setNewFolderDesc] = useState("");
  const [activeFolder, setActiveFolder] = useState(null);

  // Sharing states
  const [sharingFolderId, setSharingFolderId] = useState(null);
  const [shareEmail, setShareEmail] = useState("");
  const [sharePermission, setSharePermission] = useState("read");
  const [shareError, setShareError] = useState("");

  useEffect(() => {
    dispatch(fetchFolders());
    dispatch(fetchSharedFolders());
  }, [dispatch]);

  // Keep active folder in sync with updated list
  useEffect(() => {
    if (activeFolder) {
      const allFolders = [...folders, ...sharedFolders];
      const updated = allFolders.find((f) => f._id === activeFolder._id);
      if (updated && updated !== activeFolder) {
        setActiveFolder(updated);
      } else if (!updated) {
        setActiveFolder(null);
      }
    }
  }, [folders, sharedFolders, activeFolder]);

  const handleCreateFolder = async (e) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    dispatch(clearFolderError());

    const action = await dispatch(
      createFolder({ name: newFolderName, description: newFolderDesc })
    );

    if (createFolder.fulfilled.match(action)) {
      dispatch(
        addToast({
          type: "success",
          title: "Folder Created",
          message: `Collaborative folder "${action.payload.name}" is ready.`,
        })
      );
      setNewFolderName("");
      setNewFolderDesc("");
      setActiveFolder(action.payload);
    } else {
      dispatch(
        addToast({
          type: "error",
          title: "Creation Failed",
          message: action.payload || "Failed to create folder.",
        })
      );
    }
  };

  const handleDeleteFolder = async (id, name, e) => {
    e.stopPropagation();
    if (
      window.confirm(
        `Are you sure you want to delete folder "${name}"? All contents will be unlinked.`
      )
    ) {
      const action = await dispatch(deleteFolder(id));
      if (deleteFolder.fulfilled.match(action)) {
        dispatch(
          addToast({
            type: "success",
            title: "Folder Deleted",
            message: `Folder "${name}" was deleted.`,
          })
        );
        if (activeFolder && activeFolder._id === id) {
          setActiveFolder(null);
        }
      } else {
        dispatch(
          addToast({
            type: "error",
            title: "Delete Failed",
            message: action.payload || "Failed to delete folder.",
          })
        );
      }
    }
  };

  const handleShareSubmit = async (e) => {
    e.preventDefault();
    if (!shareEmail.trim()) return;
    setShareError("");

    const action = await dispatch(
      shareFolder({ id: sharingFolderId, email: shareEmail, permission: sharePermission })
    );

    if (shareFolder.fulfilled.match(action)) {
      dispatch(
        addToast({
          type: "success",
          title: "Folder Shared",
          message: `Invited ${shareEmail} to collaborate on "${activeFolder?.name}".`,
        })
      );
      setShareEmail("");
      setSharingFolderId(null);
      setShareError("");
    } else {
      setShareError(action.payload || "Failed to share folder.");
    }
  };

  const handleRemoveResource = async (folderId, resourceId, resourceTitle) => {
    if (window.confirm(`Remove "${resourceTitle}" from this folder?`)) {
      const action = await dispatch(
        removeResourceFromFolder({ id: folderId, resourceId })
      );
      if (removeResourceFromFolder.fulfilled.match(action)) {
        dispatch(
          addToast({
            type: "info",
            title: "Resource Unlinked",
            message: `Removed "${resourceTitle}" from folder.`,
          })
        );
      } else {
        dispatch(
          addToast({
            type: "error",
            title: "Removal Failed",
            message: action.payload || "Could not remove resource from folder.",
          })
        );
      }
    }
  };

  const getFolderRole = (folder) => {
    if (folder.owner?._id === user?.id || folder.owner === user?.id) return "Owner";
    const share = folder.sharedWith?.find(
      (s) => s.user?._id === user?.id || s.user === user?.id
    );
    return share ? `Shared (${share.permission === "write" ? "Editor" : "Viewer"})` : "Viewer";
  };

  const canEditFolder = (folder) => {
    if (folder.owner?._id === user?.id || folder.owner === user?.id) return true;
    const share = folder.sharedWith?.find(
      (s) => s.user?._id === user?.id || s.user === user?.id
    );
    return share?.permission === "write";
  };

  return (
    <div className="folder-manager-layout">
      {/* Sidebar: Folder Creation & List */}
      <aside className="folders-sidebar">
        <div className="create-folder-section">
          <h3>Create Collaborative Folder</h3>
          <p>Group worksheets & lessons, and invite other educators to collaborate.</p>
          <form onSubmit={handleCreateFolder} className="create-folder-form">
            <div className="form-group">
              <input
                type="text"
                placeholder="Folder Name (e.g. 5th Grade Science)"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                disabled={isCreating}
                required
              />
            </div>
            <div className="form-group">
              <input
                type="text"
                placeholder="Folder Description"
                value={newFolderDesc}
                onChange={(e) => setNewFolderDesc(e.target.value)}
                disabled={isCreating}
              />
            </div>
            <button type="submit" className="btn-primary" disabled={isCreating}>
              {isCreating ? (
                <>
                  <span className="btn-spinner" /> Creating Folder...
                </>
              ) : (
                "Create Folder"
              )}
            </button>
          </form>
        </div>

        <div className="folders-list-section">
          <h3>My Folders</h3>
          {isLoading ? (
            <FolderItemSkeleton count={4} />
          ) : error ? (
            <div className="folder-error-box">
              <p>{error}</p>
              <button
                className="btn-retry btn-retry-sm"
                onClick={() => dispatch(fetchFolders())}
              >
                Retry Folders
              </button>
            </div>
          ) : folders.length === 0 ? (
            <p className="no-folders-text">No folders found. Create one above to begin.</p>
          ) : (
            <div className="folders-list">
              {folders.map((folder) => {
                const isActive = activeFolder && activeFolder._id === folder._id;
                const role = getFolderRole(folder);
                const isOwner = folder.owner?._id === user?.id || folder.owner === user?.id;
                const isDeleting = deletingFolderId === folder._id;

                return (
                  <div
                    key={folder._id}
                    className={`folder-item ${isActive ? "active" : ""} ${isDeleting ? "folder-deleting" : ""}`}
                    onClick={() => {
                      if (!isDeleting) {
                        setActiveFolder(folder);
                        setSharingFolderId(null);
                        setShareError("");
                      }
                    }}
                  >
                    <div className="folder-icon-title">
                      <svg className="folder-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                      </svg>
                      <div>
                        <h4>{folder.name}</h4>
                        <span className="folder-role-badge">{role}</span>
                      </div>
                    </div>
                    <div className="folder-item-meta">
                      <span>{folder.resources?.length || 0} items</span>
                      {isOwner && (
                        <button
                          className="btn-folder-delete"
                          onClick={(e) => handleDeleteFolder(folder._id, folder.name, e)}
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
          )}
        </div>

        <div className="folders-list-section" style={{ marginTop: "1.5rem" }}>
          <h3>Shared with Me</h3>
          {isLoadingShared ? (
            <FolderItemSkeleton count={2} />
          ) : sharedError ? (
            <div className="folder-error-box">
              <p>{sharedError}</p>
              <button
                className="btn-retry btn-retry-sm"
                onClick={() => dispatch(fetchSharedFolders())}
              >
                Retry Shared
              </button>
            </div>
          ) : sharedFolders.length === 0 ? (
            <p className="no-folders-text">No folders shared with you yet.</p>
          ) : (
            <div className="folders-list">
              {sharedFolders.map((folder) => {
                const isActive = activeFolder && activeFolder._id === folder._id;
                const role = getFolderRole(folder);

                return (
                  <div
                    key={folder._id}
                    className={`folder-item ${isActive ? "active" : ""}`}
                    onClick={() => {
                      setActiveFolder(folder);
                      setSharingFolderId(null);
                      setShareError("");
                    }}
                  >
                    <div className="folder-icon-title">
                      <svg className="folder-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                      </svg>
                      <div>
                        <h4>{folder.name}</h4>
                        <span className="folder-role-badge">{role}</span>
                      </div>
                    </div>
                    <div className="folder-item-meta">
                      <span>{folder.resources?.length || 0} items</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </aside>

      {/* Main Panel: Folder Details & Collaborative Actions */}
      <main className="folder-details-panel">
        {activeFolder ? (
          <div className="folder-details-content">
            <div className="folder-details-header">
              <div>
                <h2>{activeFolder.name}</h2>
                <p className="folder-desc">{activeFolder.description || "No description provided."}</p>
                <div className="folder-owner-info">
                  <span>
                    <strong>Owner:</strong> {activeFolder.owner?.name || "Educator"} ({activeFolder.owner?.schoolName || "School"})
                  </span>
                </div>
              </div>

              {/* Share Trigger */}
              {activeFolder.owner?._id === user?.id && (
                <button
                  className="btn-secondary btn-share-folder"
                  onClick={() => {
                    setSharingFolderId(
                      sharingFolderId === activeFolder._id ? null : activeFolder._id
                    );
                    setShareError("");
                  }}
                >
                  Share Folder
                </button>
              )}
            </div>

            {/* Sharing Sub-Form */}
            {sharingFolderId === activeFolder._id && (
              <div className="folder-share-subform">
                <h4>Share "{activeFolder.name}" with a Teacher</h4>
                {shareError && (
                  <div className="share-error-banner" role="alert">
                    <span>{shareError}</span>
                  </div>
                )}
                <form onSubmit={handleShareSubmit} className="share-form-inputs">
                  <input
                    type="email"
                    placeholder="Enter teacher's email address..."
                    value={shareEmail}
                    onChange={(e) => {
                      setShareEmail(e.target.value);
                      if (shareError) setShareError("");
                    }}
                    disabled={isSharing}
                    required
                  />
                  <select
                    value={sharePermission}
                    onChange={(e) => setSharePermission(e.target.value)}
                    disabled={isSharing}
                  >
                    <option value="read">Viewer (Read Only)</option>
                    <option value="write">Editor (Can Add/Remove)</option>
                  </select>
                  <div className="share-subform-actions">
                    <button type="submit" className="btn-primary" disabled={isSharing}>
                      {isSharing ? (
                        <>
                          <span className="btn-spinner" /> Inviting...
                        </>
                      ) : (
                        "Invite"
                      )}
                    </button>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => setSharingFolderId(null)}
                      disabled={isSharing}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Collaborators List */}
            {activeFolder.sharedWith?.length > 0 && (
              <div className="folder-collaborators-list">
                <strong>Collaborating Teachers:</strong>
                <div className="collaborator-tags">
                  {activeFolder.sharedWith.map((s) => (
                    <span key={s.user?._id || s.user} className="collab-tag" title={s.user?.schoolName}>
                      {s.user?.name || "Educator"} ({s.permission === "write" ? "Editor" : "Viewer"})
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Resources List Inside Folder */}
            <div className="folder-resources-section">
              <h3>Resources in this Folder</h3>
              {activeFolder.resources?.length === 0 ? (
                <div className="empty-folder-resources">
                  <p>This folder is currently empty.</p>
                  <span>To add items, go to the <strong>Resources</strong> tab, click a resource card, and select this folder from the dropdown menu.</span>
                </div>
              ) : (
                <div className="folder-resources-table">
                  <div className="table-header-row">
                    <span>Title</span>
                    <span>Category</span>
                    <span>Subject</span>
                    <span>Grade</span>
                    <span>Actions</span>
                  </div>
                  {activeFolder.resources.map((resource) => {
                    const isRemoving = removingResourceId === resource._id;
                    return (
                      <div key={resource._id} className={`table-data-row ${isRemoving ? "row-removing" : ""}`}>
                        <span className="resource-title-cell">{resource.title}</span>
                        <span>{resource.category}</span>
                        <span>{resource.subject}</span>
                        <span>{resource.gradeLevel}</span>
                        <div className="table-actions-cell">
                          {canEditFolder(activeFolder) && (
                            <button
                              className="btn-table-remove"
                              onClick={() => handleRemoveResource(activeFolder._id, resource._id, resource.title)}
                              disabled={isRemoving}
                              title="Remove from Folder"
                            >
                              {isRemoving ? "Removing..." : "Remove"}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="no-folder-selected">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="empty-panel-icon">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
            <h3>Select a Folder</h3>
            <p>Choose a collaborative folder from the sidebar to manage files and share permissions.</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default FolderManager;
