import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchResources,
  createResource,
  updateResource,
  deleteResource,
  downloadResource,
  setFilters,
  clearResourceError,
} from "../store/resourceSlice";
import { addResourceToFolder } from "../store/folderSlice";
import { addToast } from "../store/toastSlice";
import ResourceForm from "./ResourceForm";
import { ResourceCardSkeleton } from "./SkeletonLoader";

const CATEGORIES = ["Worksheet", "Lesson Plan", "Activity", "Study Guide"];
const SUBJECTS = ["Math", "Science", "English", "Social Studies", "Other"];
const GRADES = ["Primary", "Middle", "High"];

function ResourcesView() {
  const dispatch = useDispatch();
  const { resources, isLoading, isSaving, deletingId, downloadingId, error, filters } = useSelector(
    (state) => state.resources
  );
  const { user } = useSelector((state) => state.auth);
  const { folders, isAddingResource } = useSelector((state) => state.folders);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [selectedResource, setSelectedResource] = useState(null);
  const [folderToAdd, setFolderToAdd] = useState("");
  const [modalError, setModalError] = useState("");

  useEffect(() => {
    dispatch(fetchResources(filters));
  }, [filters, dispatch]);

  const handleFilterChange = (e) => {
    dispatch(setFilters({ [e.target.name]: e.target.value }));
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    dispatch(fetchResources(filters));
  };

  const openCreateModal = () => {
    setEditingResource(null);
    setModalError("");
    dispatch(clearResourceError());
    setIsFormOpen(true);
  };

  const openEditModal = (resource, e) => {
    e.stopPropagation();
    setEditingResource(resource);
    setModalError("");
    dispatch(clearResourceError());
    setIsFormOpen(true);
  };

  const closeModal = () => {
    setIsFormOpen(false);
    setEditingResource(null);
    setModalError("");
    dispatch(clearResourceError());
  };

  const handleUploadSubmit = async (formData) => {
    setModalError("");
    try {
      if (editingResource) {
        const action = await dispatch(
          updateResource({ id: editingResource._id, resourceData: formData })
        );
        if (updateResource.fulfilled.match(action)) {
          dispatch(
            addToast({
              type: "success",
              title: "Resource Updated",
              message: `"${action.payload.title}" has been updated successfully.`,
            })
          );
          closeModal();
        } else {
          setModalError(action.payload || "Failed to update resource.");
        }
      } else {
        const action = await dispatch(createResource(formData));
        if (createResource.fulfilled.match(action)) {
          dispatch(
            addToast({
              type: "success",
              title: "Resource Published",
              message: `"${action.payload.title}" is now shared in the library catalog.`,
            })
          );
          closeModal();
        } else {
          setModalError(action.payload || "Failed to create resource.");
        }
      }
    } catch (err) {
      setModalError(err.message || "An unexpected error occurred.");
    }
  };

  const handleDelete = async (id, title, e) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      const action = await dispatch(deleteResource(id));
      if (deleteResource.fulfilled.match(action)) {
        dispatch(
          addToast({
            type: "success",
            title: "Resource Deleted",
            message: `"${title}" was removed from the catalog.`,
          })
        );
        if (selectedResource && selectedResource._id === id) {
          setSelectedResource(null);
        }
      } else {
        dispatch(
          addToast({
            type: "error",
            title: "Delete Failed",
            message: action.payload || "Could not delete resource.",
          })
        );
      }
    }
  };

  const handleResourceClick = (resource) => {
    setSelectedResource(resource);
    setFolderToAdd("");
  };

  const handleDownload = async (resource) => {
    const action = await dispatch(downloadResource(resource._id));
    if (downloadResource.fulfilled.match(action)) {
      // Build text file blob for offline access
      const fileContent =
        `=== ${resource.title} ===\n\n` +
        `Category: ${resource.category}\n` +
        `Subject: ${resource.subject}\n` +
        `Grade Level: ${resource.gradeLevel}\n` +
        `Author: ${resource.author?.name || "Anonymous"} (${resource.author?.schoolName || "Rural School"})\n` +
        `Description: ${resource.description || "N/A"}\n\n` +
        `----------------------------------------\n\n` +
        `${resource.content}`;

      const blob = new Blob([fileContent], { type: "text/plain;charset=utf-8" });
      const element = document.createElement("a");
      element.href = URL.createObjectURL(blob);
      element.download = `${resource.title.replace(/\s+/g, "_")}.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);

      dispatch(
        addToast({
          type: "success",
          title: "Download Started",
          message: `Saved "${resource.title}" for offline learning access.`,
        })
      );

      setSelectedResource((prev) =>
        prev ? { ...prev, downloadCount: action.payload.downloadCount } : null
      );
    } else {
      dispatch(
        addToast({
          type: "error",
          title: "Download Error",
          message: action.payload || "Failed to download resource content.",
        })
      );
    }
  };

  const handleAddToFolder = async () => {
    if (!folderToAdd || !selectedResource) return;
    const folderObj = folders.find((f) => f._id === folderToAdd);
    const action = await dispatch(
      addResourceToFolder({ id: folderToAdd, resourceId: selectedResource._id })
    );

    if (addResourceToFolder.fulfilled.match(action)) {
      dispatch(
        addToast({
          type: "success",
          title: "Added to Folder",
          message: `Added "${selectedResource.title}" to folder "${folderObj?.name || "Folder"}".`,
        })
      );
      setFolderToAdd("");
    } else {
      dispatch(
        addToast({
          type: "error",
          title: "Action Failed",
          message: action.payload || "Failed to add resource to folder.",
        })
      );
    }
  };

  return (
    <div className="resources-view">
      {/* Search & Filter Panel */}
      <section className="filters-panel">
        <form onSubmit={handleSearchSubmit} className="search-form">
          <input
            type="text"
            name="search"
            placeholder="Search resources by keywords..."
            value={filters.search}
            onChange={handleFilterChange}
          />
          <button type="submit" className="btn-primary">Search</button>
        </form>

        <div className="filter-selects">
          <div className="filter-group">
            <label>Subject</label>
            <select name="subject" value={filters.subject} onChange={handleFilterChange}>
              <option value="">All Subjects</option>
              {SUBJECTS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Category</label>
            <select name="category" value={filters.category} onChange={handleFilterChange}>
              <option value="">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Grade Level</label>
            <select name="gradeLevel" value={filters.gradeLevel} onChange={handleFilterChange}>
              <option value="">All Grades</option>
              {GRADES.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          <button
            type="button"
            className="btn-primary btn-upload-trigger"
            onClick={openCreateModal}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="upload-btn-icon">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Share Resource
          </button>
        </div>
      </section>

      {/* Upload/Edit Modal */}
      {isFormOpen && (
        <div className="modal-overlay">
          <div className="modal-content form-modal">
            <h3>{editingResource ? "Edit Resource" : "Share a Lesson Material"}</h3>
            <p className="modal-subtitle">Shared materials can be downloaded offline by other educators</p>

            {modalError && (
              <div className="modal-error-banner" role="alert">
                <svg className="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{modalError}</span>
              </div>
            )}

            <ResourceForm
              onSubmit={handleUploadSubmit}
              initialData={editingResource}
              onCancel={closeModal}
              isSaving={isSaving}
              submitText={
                isSaving
                  ? editingResource ? "Saving Changes..." : "Publishing..."
                  : editingResource ? "Save Changes" : "Publish to Library"
              }
            />
          </div>
        </div>
      )}

      {/* Details View Modal */}
      {selectedResource && (
        <div className="modal-overlay" onClick={() => setSelectedResource(null)}>
          <div className="modal-content details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className={`category-tag ${selectedResource.category.toLowerCase().replace(/\s+/g, "-")}`}>
                {selectedResource.category}
              </span>
              <button className="modal-close-btn" onClick={() => setSelectedResource(null)}>&times;</button>
            </div>

            <h2>{selectedResource.title}</h2>
            <div className="resource-meta-details">
              <span><strong>Subject:</strong> {selectedResource.subject}</span>
              <span><strong>Grade:</strong> {selectedResource.gradeLevel}</span>
              <span><strong>Downloads:</strong> {selectedResource.downloadCount}</span>
            </div>

            <div className="author-card-panel">
              <div className="avatar avatar-pink">
                {selectedResource.author?.name?.charAt(0).toUpperCase() || "?"}
              </div>
              <div className="author-meta-info">
                <h4>{selectedResource.author?.name || "Educator"}</h4>
                <span>{selectedResource.author?.schoolName || "Community School"}</span>
              </div>
            </div>

            {selectedResource.description && (
              <div className="details-description">
                <strong>Description:</strong>
                <p>{selectedResource.description}</p>
              </div>
            )}

            <div className="details-content-box">
              <strong>Worksheet / Material Content (Available Offline):</strong>
              <pre>{selectedResource.content}</pre>
            </div>

            <div className="details-actions">
              {/* Folder Selector to Add Resource */}
              {user && folders.length > 0 && (
                <div className="add-to-folder-wrapper">
                  <select
                    value={folderToAdd}
                    onChange={(e) => setFolderToAdd(e.target.value)}
                    className="folder-select-dropdown"
                    disabled={isAddingResource}
                  >
                    <option value="">-- Add to Folder --</option>
                    {folders.map((f) => (
                      <option key={f._id} value={f._id}>{f.name}</option>
                    ))}
                  </select>
                  <button
                    onClick={handleAddToFolder}
                    className="btn-secondary"
                    disabled={!folderToAdd || isAddingResource}
                  >
                    {isAddingResource ? "Adding..." : "Add"}
                  </button>
                </div>
              )}

              <button
                className="btn-primary btn-download"
                onClick={() => handleDownload(selectedResource)}
                disabled={downloadingId === selectedResource._id}
              >
                {downloadingId === selectedResource._id ? (
                  <>
                    <span className="btn-spinner" /> Preparing File...
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="download-btn-icon">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Download Offline Text
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resources Library Grid */}
      <section className="resources-library">
        {isLoading ? (
          <ResourceCardSkeleton count={6} />
        ) : error ? (
          <div className="error-container" role="alert">
            <svg className="error-container-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <h3>Failed to Load Resources</h3>
            <p>{error}</p>
            <button className="btn-retry" onClick={() => dispatch(fetchResources(filters))}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="btn-icon-sm">
                <path d="M23 4v6h-6" />
                <path d="M1 20v-6h6" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
              Retry Loading Library
            </button>
          </div>
        ) : resources.length === 0 ? (
          <div className="empty-container">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="empty-icon">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
            <p>No resources match your search.</p>
            <span>Click 'Share Resource' to upload the first one.</span>
          </div>
        ) : (
          <div className="resources-grid">
            {resources.map((resource) => {
              const isOwner = user && resource.author?._id === user.id;
              const firstLetter = resource.author?.name ? resource.author.name.charAt(0).toUpperCase() : "?";
              const colors = ["avatar-pink", "avatar-purple", "avatar-blue", "avatar-teal", "avatar-orange"];
              const charCode = firstLetter.charCodeAt(0) || 0;
              const avatarClass = colors[charCode % colors.length];
              const isDeleting = deletingId === resource._id;

              return (
                <div
                  key={resource._id}
                  className={`resource-card ${isDeleting ? "card-deleting" : ""}`}
                  onClick={() => handleResourceClick(resource)}
                >
                  {isDeleting && (
                    <div className="card-deleting-overlay">
                      <span className="btn-spinner" />
                      <span>Deleting...</span>
                    </div>
                  )}

                  <div className="card-header">
                    <span className={`category-tag ${resource.category.toLowerCase().replace(/\s+/g, "-")}`}>
                      {resource.category}
                    </span>
                    <span className="badge">{resource.gradeLevel}</span>
                  </div>

                  <h3>{resource.title}</h3>
                  <p className="card-desc">{resource.description || "No description provided."}</p>

                  <div className="card-metadata">
                    <div className="author-tag">
                      <div className={`avatar ${avatarClass} avatar-sm`}>
                        {firstLetter}
                      </div>
                      <div className="author-info">
                        <span>{resource.author?.name || "Educator"}</span>
                        <span className="school-tag">{resource.author?.schoolName || "School"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="card-footer">
                    <span className="subject-badge">{resource.subject}</span>
                    <div className="stats-tag">
                      <svg className="stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                      {resource.downloadCount}
                    </div>
                  </div>

                  {isOwner && (
                    <div className="card-owner-actions">
                      <button
                        className="btn-icon btn-edit"
                        onClick={(e) => openEditModal(resource, e)}
                        disabled={isDeleting}
                      >
                        Edit
                      </button>
                      <button
                        className="btn-icon btn-delete"
                        onClick={(e) => handleDelete(resource._id, resource.title, e)}
                        disabled={isDeleting}
                      >
                        {isDeleting ? "..." : "Delete"}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

export default ResourcesView;
