import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchFolders,
  fetchSharedFolders,
  createFolder,
  deleteFolder,
  shareFolder,
  updateCollaboratorPermission,
  removeUserFromFolder,
  addResourceToFolder,
  removeResourceFromFolder,
  clearFolderError,
} from "../store/folderSlice";
import { createResource } from "../store/resourceSlice";
import { addToast } from "../store/toastSlice";
import { FolderItemSkeleton, TableRowSkeleton } from "./SkeletonLoader";
import FolderModal from "./FolderModal";
import ResourceForm from "./ResourceForm";
import FolderList from "./FolderList";

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
    updatingPermissionUserId,
    error,
    sharedError,
  } = useSelector((state) => state.folders);
  const { user } = useSelector((state) => state.auth);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [modalServerError, setModalServerError] = useState("");
  const [activeFolder, setActiveFolder] = useState(null);

  // Sharing states
  const [sharingFolderId, setSharingFolderId] = useState(null);
  const [shareEmail, setShareEmail] = useState("");
  const [sharePermission, setSharePermission] = useState("read");
  const [shareError, setShareError] = useState("");

  // Upload resource to folder states
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadServerError, setUploadServerError] = useState("");
  const [isUploadingResource, setIsUploadingResource] = useState(false);

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

  const handleModalSubmit = async ({ name, description }) => {
    setModalServerError("");
    dispatch(clearFolderError());

    const action = await dispatch(
      createFolder({ name, description })
    );

    if (createFolder.fulfilled.match(action)) {
      dispatch(
        addToast({
          type: "success",
          title: "Folder Created",
          message: `Collaborative folder "${action.payload.name}" is ready.`,
        })
      );
      setIsCreateModalOpen(false);
      setActiveFolder(action.payload);
    } else {
      setModalServerError(action.payload || "Failed to create folder.");
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

  const handleUpdatePermission = async (collabUser, newPermission) => {
    if (!activeFolder) return;
    const userId = collabUser?._id || (typeof collabUser === "string" ? collabUser : null);
    const email = collabUser?.email;
    const collabName = collabUser?.name || "Educator";

    const action = await dispatch(
      updateCollaboratorPermission({
        id: activeFolder._id,
        userId,
        email,
        permission: newPermission,
      })
    );

    if (updateCollaboratorPermission.fulfilled.match(action)) {
      dispatch(
        addToast({
          type: "success",
          title: "Permission Updated",
          message: `Changed permission for ${collabName} to ${
            newPermission === "write" ? "Editor (Can Add/Remove)" : "Viewer (Read Only)"
          }.`,
        })
      );
    } else {
      dispatch(
        addToast({
          type: "error",
          title: "Permission Update Failed",
          message: action.payload || "Failed to update collaborator permission.",
        })
      );
    }
  };

  const handleRemoveCollaborator = async (collabUser) => {
    if (!activeFolder) return;
    const userId = collabUser?._id || (typeof collabUser === "string" ? collabUser : null);
    const collabName = collabUser?.name || "Educator";

    if (!userId) return;

    if (
      window.confirm(
        `Are you sure you want to remove ${collabName} from folder "${activeFolder.name}"?`
      )
    ) {
      const action = await dispatch(
        removeUserFromFolder({ id: activeFolder._id, userId })
      );

      if (removeUserFromFolder.fulfilled.match(action)) {
        dispatch(
          addToast({
            type: "info",
            title: "Collaborator Removed",
            message: `Removed ${collabName} from folder "${activeFolder.name}".`,
          })
        );
      } else {
        dispatch(
          addToast({
            type: "error",
            title: "Removal Failed",
            message: action.payload || "Could not remove collaborator.",
          })
        );
      }
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

  const handleUploadToFolderSubmit = async (formData) => {
    if (!activeFolder) return;
    setUploadServerError("");
    setIsUploadingResource(true);

    const resourceAction = await dispatch(createResource(formData));

    if (createResource.fulfilled.match(resourceAction)) {
      const createdResource = resourceAction.payload;
      const folderAction = await dispatch(
        addResourceToFolder({ id: activeFolder._id, resourceId: createdResource._id })
      );

      if (addResourceToFolder.fulfilled.match(folderAction)) {
        dispatch(
          addToast({
            type: "success",
            title: "Resource Uploaded",
            message: `"${createdResource.title}" was uploaded and added to folder "${activeFolder.name}".`,
          })
        );
        setIsUploadModalOpen(false);
      } else {
        setUploadServerError(folderAction.payload || "Failed to associate resource with folder.");
      }
    } else {
      setUploadServerError(resourceAction.payload || "Failed to create resource.");
    }
    setIsUploadingResource(false);
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
      {/* Folder Creation Modal */}
      <FolderModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setModalServerError("");
        }}
        onSubmit={handleModalSubmit}
        isSubmitting={isCreating}
        serverError={modalServerError}
      />

      {/* Resource Upload to Folder Modal */}
      {isUploadModalOpen && (
        <div className="modal-overlay" onClick={() => setIsUploadModalOpen(false)}>
          <div className="modal-content form-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Upload Resource to "{activeFolder?.name}"</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsUploadModalOpen(false)}
              >
                &times;
              </button>
            </div>
            <p className="modal-subtitle">
              Upload a lesson material or worksheet with the file picker to add it directly to this collaborative folder.
            </p>

            {uploadServerError && (
              <div className="modal-error-banner" role="alert">
                <svg className="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{uploadServerError}</span>
              </div>
            )}

            <ResourceForm
              onSubmit={handleUploadToFolderSubmit}
              onCancel={() => setIsUploadModalOpen(false)}
              isSaving={isUploadingResource}
              submitText={isUploadingResource ? "Uploading..." : "Upload & Save to Folder"}
            />
          </div>
        </div>
      )}

      {/* Sidebar: Folder Creation & List */}
      <aside className="folders-sidebar">
        <div className="create-folder-section">
          <h3>Create Collaborative Folder</h3>
          <p>Group worksheets & lessons, and invite other educators to collaborate.</p>
          <button
            type="button"
            className="btn-primary"
            style={{ width: "100%" }}
            onClick={() => {
              setModalServerError("");
              setIsCreateModalOpen(true);
            }}
          >
            + New Folder
          </button>
        </div>

        <div className="folders-list-section">
          <h3>My Folders</h3>
          <FolderList
            folders={folders}
            activeFolder={activeFolder}
            onSelectFolder={(folder) => {
              setActiveFolder(folder);
              setSharingFolderId(null);
              setShareError("");
            }}
            onDeleteFolder={handleDeleteFolder}
            isLoading={isLoading}
            error={error}
            onRetry={() => dispatch(fetchFolders())}
            emptyMessage="No folders found. Create one above to begin."
            deletingFolderId={deletingFolderId}
            currentUserId={user?.id}
            getFolderRole={getFolderRole}
          />
        </div>

        <div className="folders-list-section" style={{ marginTop: "1.5rem" }}>
          <h3>Shared with Me</h3>
          <FolderList
            folders={sharedFolders}
            activeFolder={activeFolder}
            onSelectFolder={(folder) => {
              setActiveFolder(folder);
              setSharingFolderId(null);
              setShareError("");
            }}
            isLoading={isLoadingShared}
            error={sharedError}
            onRetry={() => dispatch(fetchSharedFolders())}
            emptyMessage="No folders shared with you yet."
            currentUserId={user?.id}
            getFolderRole={getFolderRole}
          />
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

              {/* Header Action Buttons */}
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                {canEditFolder(activeFolder) && (
                  <button
                    className="btn-primary"
                    onClick={() => {
                      setUploadServerError("");
                      setIsUploadModalOpen(true);
                    }}
                  >
                    + Upload Resource
                  </button>
                )}
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

            {/* Collaborators & Permission Management Section */}
            <div className="folder-collaborators-section">
              <div className="collaborators-section-header">
                <div className="section-title-with-badge">
                  <h3>Collaborator Permissions</h3>
                  <span className="collaborators-count-badge">
                    {activeFolder.sharedWith?.length || 0} Collaborator{activeFolder.sharedWith?.length !== 1 ? "s" : ""}
                  </span>
                </div>
                {activeFolder.owner?._id === user?.id && (
                  <button
                    type="button"
                    className="btn-secondary btn-sm"
                    onClick={() => {
                      setSharingFolderId(
                        sharingFolderId === activeFolder._id ? null : activeFolder._id
                      );
                      setShareError("");
                    }}
                  >
                    + Add Collaborator
                  </button>
                )}
              </div>

              {!activeFolder.sharedWith || activeFolder.sharedWith.length === 0 ? (
                <div className="empty-collaborators-box">
                  <svg className="collab-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  <p>No collaborators added to this folder yet.</p>
                  {activeFolder.owner?._id === user?.id && (
                    <span className="empty-collab-subtext">Click "+ Add Collaborator" above or "Share Folder" to invite teachers to view or edit this folder.</span>
                  )}
                </div>
              ) : (
                <div className="collaborator-permission-cards">
                  {activeFolder.sharedWith.map((s) => {
                    const collabUser = s.user;
                    const collabId = collabUser?._id || collabUser;
                    const collabName = collabUser?.name || "Educator";
                    const collabEmail = collabUser?.email || "";
                    const collabSchool = collabUser?.schoolName || "";
                    const isOwner = activeFolder.owner?._id === user?.id || activeFolder.owner === user?.id;
                    const isCurrentUpdating = updatingPermissionUserId === collabId || updatingPermissionUserId === collabEmail;

                    return (
                      <div key={collabId} className="collaborator-permission-card">
                        <div className="collab-profile">
                          <div className="collab-avatar">
                            {collabName.charAt(0).toUpperCase()}
                          </div>
                          <div className="collab-meta">
                            <h4 className="collab-name">{collabName}</h4>
                            {collabEmail && <span className="collab-email">{collabEmail}</span>}
                            {collabSchool && <span className="collab-school">{collabSchool}</span>}
                          </div>
                        </div>

                        <div className="collab-permission-controls">
                          {isOwner ? (
                            <div className="permission-select-wrapper">
                              <select
                                className={`collab-permission-dropdown ${s.permission}`}
                                value={s.permission}
                                onChange={(e) => handleUpdatePermission(collabUser, e.target.value)}
                                disabled={isCurrentUpdating}
                                title="Change Collaborator Permission"
                              >
                                <option value="read">Viewer (Read Only)</option>
                                <option value="write">Editor (Can Add/Remove)</option>
                              </select>
                              {isCurrentUpdating && <span className="btn-spinner permission-spinner" />}
                            </div>
                          ) : (
                            <span className={`collab-role-pill ${s.permission === "write" ? "editor" : "viewer"}`}>
                              {s.permission === "write" ? "Editor" : "Viewer"}
                            </span>
                          )}

                          {isOwner && (
                            <button
                              type="button"
                              className="btn-remove-collaborator"
                              onClick={() => handleRemoveCollaborator(collabUser)}
                              disabled={isCurrentUpdating}
                              title={`Remove ${collabName} from folder`}
                            >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="remove-icon">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                              </svg>
                              <span>Remove</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Resources List Inside Folder */}
            <div className="folder-resources-section">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <h3 style={{ margin: 0 }}>Resources in this Folder</h3>
                {canEditFolder(activeFolder) && (
                  <button
                    className="btn-secondary btn-sm"
                    onClick={() => {
                      setUploadServerError("");
                      setIsUploadModalOpen(true);
                    }}
                  >
                    + Add / Upload Resource
                  </button>
                )}
              </div>
              {activeFolder.resources?.length === 0 ? (
                <div className="empty-folder-resources">
                  <p>This folder is currently empty.</p>
                  <span>Upload a worksheet or lesson material using the button below or link existing resources from the catalog.</span>
                  {canEditFolder(activeFolder) && (
                    <button
                      className="btn-primary"
                      style={{ marginTop: "14px" }}
                      onClick={() => {
                        setUploadServerError("");
                        setIsUploadModalOpen(true);
                      }}
                    >
                      + Upload Resource to Folder
                    </button>
                  )}
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
