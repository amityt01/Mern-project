import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchResources, createResource, updateResource, deleteResource, downloadResource, setFilters } from "../store/resourceSlice";
import { addResourceToFolder } from "../store/folderSlice";
import ResourceForm from "./ResourceForm";

const CATEGORIES = ["Worksheet", "Lesson Plan", "Activity", "Study Guide"];
const SUBJECTS = ["Math", "Science", "English", "Social Studies", "Other"];
const GRADES = ["Primary", "Middle", "High"];

function ResourcesView() {
  const dispatch = useDispatch();
  const { resources, isLoading, error, filters } = useSelector((state) => state.resources);
  const { user } = useSelector((state) => state.auth);
  const { folders } = useSelector((state) => state.folders);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [selectedResource, setSelectedResource] = useState(null);
  const [folderToAdd, setFolderToAdd] = useState("");

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

  const handleUploadSubmit = (formData) => {
    if (editingResource) {
      dispatch(updateResource({ id: editingResource._id, resourceData: formData }));
    } else {
      dispatch(createResource(formData));
    }
    setIsFormOpen(false);
    setEditingResource(null);
  };

  const handleDelete = (id, e) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this resource?")) {
      dispatch(deleteResource(id));
      if (selectedResource && selectedResource._id === id) {
        setSelectedResource(null);
      }
    }
  };

  const handleEditClick = (resource, e) => {
    e.stopPropagation();
    setEditingResource(resource);
    setIsFormOpen(true);
  };

  const handleResourceClick = (resource) => {
    setSelectedResource(resource);
    setFolderToAdd("");
  };

  const handleDownload = (resource) => {
    // 1. Increment download count in backend
    dispatch(downloadResource(resource._id));

    // 2. Download the resource content as a text file for low-bandwidth offline access
    const fileContent = `=== ${resource.title} ===\n\n` +
      `Category: ${resource.category}\n` +
      `Subject: ${resource.subject}\n` +
      `Grade Level: ${resource.gradeLevel}\n` +
      `Author: ${resource.author?.name || "Anonymous"} (${resource.author?.schoolName || "Rural School"})\n` +
      `Description: ${resource.description}\n\n` +
      `----------------------------------------\n\n` +
      `${resource.content}`;

    const blob = new Blob([fileContent], { type: "text/plain;charset=utf-8" });
    const element = document.createElement("a");
    element.href = URL.createObjectURL(blob);
    element.download = `${resource.title.replace(/\s+/g, "_")}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    // Update locally in modal
    setSelectedResource((prev) => prev ? { ...prev, downloadCount: prev.downloadCount + 1 } : null);
  };

  const handleAddToFolder = () => {
    if (!folderToAdd) return;
    dispatch(addResourceToFolder({ id: folderToAdd, resourceId: selectedResource._id }))
      .unwrap()
      .then(() => {
        alert("Resource added to folder successfully!");
        setFolderToAdd("");
      })
      .catch((err) => {
        alert(err || "Failed to add to folder");
      });
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
              {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="filter-group">
            <label>Category</label>
            <select name="category" value={filters.category} onChange={handleFilterChange}>
              <option value="">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="filter-group">
            <label>Grade Level</label>
            <select name="gradeLevel" value={filters.gradeLevel} onChange={handleFilterChange}>
              <option value="">All Grades</option>
              {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          <button
            type="button"
            className="btn-primary btn-upload-trigger"
            onClick={() => {
              setEditingResource(null);
              setIsFormOpen(true);
            }}
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
            <ResourceForm
              onSubmit={handleUploadSubmit}
              initialData={editingResource}
              onCancel={() => {
                setIsFormOpen(false);
                setEditingResource(null);
              }}
              submitText={editingResource ? "Save Changes" : "Publish to Library"}
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
                  >
                    <option value="">-- Add to Folder --</option>
                    {folders.map(f => (
                      <option key={f._id} value={f._id}>{f.name}</option>
                    ))}
                  </select>
                  <button
                    onClick={handleAddToFolder}
                    className="btn-secondary"
                    disabled={!folderToAdd}
                  >
                    Add
                  </button>
                </div>
              )}

              <button
                className="btn-primary btn-download"
                onClick={() => handleDownload(selectedResource)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="download-btn-icon">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Download Offline Text
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resources Library Grid */}
      <section className="resources-library">
        {isLoading ? (
          <div className="loader-container">
            <div className="spinner"></div>
            <p>Loading library catalogs...</p>
          </div>
        ) : error ? (
          <div className="error-container">
            <p>{error}</p>
            <button className="btn-retry" onClick={() => dispatch(fetchResources(filters))}>Retry</button>
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

              return (
                <div
                  key={resource._id}
                  className="resource-card"
                  onClick={() => handleResourceClick(resource)}
                >
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
                      <button className="btn-icon btn-edit" onClick={(e) => handleEditClick(resource, e)}>
                        Edit
                      </button>
                      <button className="btn-icon btn-delete" onClick={(e) => handleDelete(resource._id, e)}>
                        Delete
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
