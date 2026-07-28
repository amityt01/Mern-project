import { useState, useEffect, useRef } from "react";

const CATEGORIES = ["Worksheet", "Lesson Plan", "Activity", "Study Guide"];
const SUBJECTS = ["Math", "Science", "English", "Social Studies", "Other"];
const GRADES = ["Primary", "Middle", "High"];

const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "image/png",
  "image/jpeg",
];
const ALLOWED_EXTENSIONS = [".pdf", ".doc", ".docx", ".txt", ".png", ".jpg", ".jpeg"];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

function ResourceForm({
  onSubmit,
  initialData,
  onCancel,
  isSaving = false,
  submitText = "Share Resource",
  serverError = null,
}) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "Worksheet",
    subject: "Math",
    gradeLevel: "Primary",
    content: "",
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || "",
        description: initialData.description || "",
        category: initialData.category || "Worksheet",
        subject: initialData.subject || "Math",
        gradeLevel: initialData.gradeLevel || "Primary",
        content: initialData.content || "",
      });
      if (initialData.fileName) {
        setSelectedFile({
          name: initialData.fileName,
          size: initialData.fileSize || 0,
          type: initialData.fileType || "",
        });
      } else {
        setSelectedFile(null);
      }
    } else {
      setFormData({
        title: "",
        description: "",
        category: "Worksheet",
        subject: "Math",
        gradeLevel: "Primary",
        content: "",
      });
      setSelectedFile(null);
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validateFile = (file) => {
    if (!file) return null;

    const fileExtension = "." + file.name.split(".").pop().toLowerCase();
    const isExtensionValid = ALLOWED_EXTENSIONS.includes(fileExtension);
    const isTypeValid = ALLOWED_FILE_TYPES.includes(file.type) || isExtensionValid;

    if (!isTypeValid) {
      return `Invalid file format (${fileExtension}). Allowed formats: PDF, DOC, DOCX, TXT, PNG, JPG, JPEG.`;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      return `File size (${sizeMB} MB) exceeds the maximum limit of 5 MB for rural uploads.`;
    }

    return null;
  };

  const processFile = (file) => {
    const fileError = validateFile(file);
    if (fileError) {
      setErrors((prev) => ({ ...prev, file: fileError }));
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setErrors((prev) => ({ ...prev, file: null }));
    setSelectedFile({
      name: file.name,
      size: file.size,
      type: file.type,
      fileObject: file,
    });

    // If text file, auto-populate or append to content
    if (file.type === "text/plain" || file.name.endsWith(".txt")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target.result;
        if (text) {
          setFormData((prev) => ({
            ...prev,
            content: prev.content ? `${prev.content}\n\n${text}` : text,
          }));
        }
      };
      reader.readAsText(file);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      processFile(file);
      e.dataTransfer.clearData();
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setErrors((prev) => ({ ...prev, file: null }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const newErrors = {};
    if (!formData.title.trim()) {
      newErrors.title = "Resource title is required.";
    } else if (formData.title.trim().length < 3) {
      newErrors.title = "Title must be at least 3 characters long.";
    }

    if (!formData.category) {
      newErrors.category = "Category selection is required.";
    }

    if (!formData.content.trim() && !selectedFile) {
      newErrors.content = "Please provide lesson content or attach an educational file.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Attach file metadata and File object if present
    const submissionData = {
      ...formData,
      ...(selectedFile && {
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        fileType: selectedFile.type,
        ...(selectedFile.fileObject && {
          fileObject: selectedFile.fileObject,
          file: selectedFile.fileObject,
        }),
      }),
    };

    onSubmit(submissionData);
  };

  return (
    <form onSubmit={handleSubmit} className="resource-upload-form" noValidate>
      {serverError && (
        <div className="modal-error-banner" role="alert" style={{ marginBottom: "16px" }}>
          <svg className="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{serverError}</span>
        </div>
      )}
      {initialData && (
        <div className="edit-mode-banner" style={{
          marginBottom: "16px",
          padding: "10px 14px",
          borderRadius: "8px",
          backgroundColor: "rgba(99, 102, 241, 0.12)",
          border: "1px solid rgba(99, 102, 241, 0.3)",
          color: "#818cf8",
          fontSize: "13px",
          fontWeight: "500",
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          <span>Editing Resource: <strong>{initialData.title}</strong></span>
        </div>
      )}
      {/* Title Field */}
      <div className="form-group">
        <label htmlFor="title">
          Title <span className="required-star">*</span>
        </label>
        <input
          type="text"
          id="title"
          name="title"
          placeholder="e.g. Grade 5 Fractions Practice Worksheet"
          value={formData.title}
          onChange={handleChange}
          disabled={isSaving}
          className={errors.title ? "input-error" : ""}
        />
        {errors.title && <span className="form-field-error">{errors.title}</span>}
      </div>

      {/* Description Field */}
      <div className="form-group">
        <label htmlFor="description">Short Description / Overview</label>
        <input
          type="text"
          id="description"
          name="description"
          placeholder="e.g. Step-by-step introduction to adding fractions with like denominators"
          value={formData.description}
          onChange={handleChange}
          disabled={isSaving}
        />
      </div>

      {/* Category, Subject, Grade Level Row */}
      <div className="form-row-three">
        <div className="form-group">
          <label htmlFor="category">
            Category <span className="required-star">*</span>
          </label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            disabled={isSaving}
            className={errors.category ? "input-error" : ""}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          {errors.category && <span className="form-field-error">{errors.category}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="subject">Subject</label>
          <select
            id="subject"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            disabled={isSaving}
          >
            {SUBJECTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="gradeLevel">Grade Level</label>
          <select
            id="gradeLevel"
            name="gradeLevel"
            value={formData.gradeLevel}
            onChange={handleChange}
            disabled={isSaving}
          >
            {GRADES.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* File Upload Input Section with Validation */}
      <div className="form-group">
        <label>
          Attach File <span className="optional-tag">(Optional - Max 5 MB)</span>
        </label>

        <input
          type="file"
          id="file"
          name="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept={ALLOWED_EXTENSIONS.join(",")}
          style={{ display: "none" }}
          disabled={isSaving}
        />

        {!selectedFile ? (
          <div
            className={`file-dropzone ${isDragOver ? "drag-over" : ""} ${
              errors.file ? "dropzone-error" : ""
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
          >
            <div className="dropzone-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <div className="dropzone-text">
              <span className="dropzone-prompt">Click to select file</span> or drag & drop here
            </div>
            <div className="dropzone-formats">Supported formats: PDF, DOC, DOCX, TXT, PNG, JPG (Max 5 MB)</div>
          </div>
        ) : (
          <div className="file-info-badge">
            <div className="file-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <div className="file-details">
              <span className="file-name">{selectedFile.name}</span>
              <span className="file-size">{formatFileSize(selectedFile.size)}</span>
            </div>
            <button
              type="button"
              className="btn-remove-file"
              onClick={handleRemoveFile}
              disabled={isSaving}
              title="Remove file"
            >
              &times;
            </button>
          </div>
        )}

        {errors.file && <span className="form-field-error">{errors.file}</span>}
      </div>

      {/* Resource Content Field */}
      <div className="form-group">
        <label htmlFor="content">
          Resource Content / Lesson Material <span className="required-star">*</span>
        </label>
        <textarea
          id="content"
          name="content"
          placeholder="Paste or write the lesson text, worksheet problems, or instructions here..."
          value={formData.content}
          onChange={handleChange}
          rows={7}
          disabled={isSaving}
          className={errors.content ? "input-error" : ""}
        />
        {errors.content && <span className="form-field-error">{errors.content}</span>}
      </div>

      {/* Form Action Buttons */}
      <div className="form-actions">
        <button type="button" className="btn-secondary" onClick={onCancel} disabled={isSaving}>
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={isSaving}>
          {isSaving ? (
            <>
              <span className="btn-spinner" /> Sharing...
            </>
          ) : (
            submitText
          )}
        </button>
      </div>
    </form>
  );
}

export default ResourceForm;
