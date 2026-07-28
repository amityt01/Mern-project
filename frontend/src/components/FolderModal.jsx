import { useState, useEffect } from "react";

function FolderModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
  serverError = "",
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setName("");
      setDescription("");
      setErrors({});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors = {};

    if (!name.trim()) {
      newErrors.name = "Folder name is required.";
    } else if (name.trim().length < 2) {
      newErrors.name = "Folder name must be at least 2 characters.";
    }

    if (description && description.length > 300) {
      newErrors.description = "Description cannot exceed 300 characters.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNameChange = (e) => {
    setName(e.target.value);
    if (errors.name) {
      setErrors((prev) => ({ ...prev, name: null }));
    }
  };

  const handleDescriptionChange = (e) => {
    setDescription(e.target.value);
    if (errors.description) {
      setErrors((prev) => ({ ...prev, description: null }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit({ name: name.trim(), description: description.trim() });
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content form-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3>Create Collaborative Folder</h3>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            &times;
          </button>
        </div>
        <p className="modal-subtitle">
          Group worksheets & lesson materials, and collaborate with other educators.
        </p>

        {serverError && (
          <div className="modal-error-banner" role="alert">
            <svg
              className="error-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="create-folder-form">
          <div className={`form-group ${errors.name ? "has-error" : ""}`}>
            <label htmlFor="folder-name-input">
              Folder Name <span className="required-star">*</span>
            </label>
            <input
              id="folder-name-input"
              type="text"
              placeholder="e.g. 5th Grade Science & Math"
              value={name}
              onChange={handleNameChange}
              disabled={isSubmitting}
              className={errors.name ? "input-error" : ""}
              autoFocus
            />
            {errors.name && (
              <span className="form-field-error" id="folder-name-error">
                {errors.name}
              </span>
            )}
          </div>

          <div
            className={`form-group ${errors.description ? "has-error" : ""}`}
            style={{ marginTop: "12px" }}
          >
            <label htmlFor="folder-desc-input">
              Description <span className="optional-tag">(Optional)</span>
            </label>
            <textarea
              id="folder-desc-input"
              placeholder="Brief description of the folder's topic, curriculum, or target grade..."
              value={description}
              onChange={handleDescriptionChange}
              disabled={isSubmitting}
              rows={3}
              className={errors.description ? "input-error" : ""}
              style={{
                width: "100%",
                background: "var(--bg-primary)",
                border: "1px solid var(--border-color)",
                color: "#ffffff",
                padding: "12px 16px",
                borderRadius: "var(--radius-md)",
                fontFamily: "inherit",
                fontSize: "13px",
                resize: "vertical",
              }}
            />
            {errors.description && (
              <span className="form-field-error" id="folder-desc-error">
                {errors.description}
              </span>
            )}
          </div>

          <div
            className="modal-actions"
            style={{
              display: "flex",
              justify: "flex-end",
              gap: "12px",
              marginTop: "20px",
            }}
          >
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="btn-spinner" /> Creating Folder...
                </>
              ) : (
                "Create Folder"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default FolderModal;
