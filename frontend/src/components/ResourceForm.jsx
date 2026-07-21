import { useState, useEffect } from "react";

const CATEGORIES = ["Worksheet", "Lesson Plan", "Activity", "Study Guide"];
const SUBJECTS = ["Math", "Science", "English", "Social Studies", "Other"];
const GRADES = ["Primary", "Middle", "High"];

function ResourceForm({ onSubmit, initialData, onCancel, isSaving = false, submitText = "Share Resource" }) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "Worksheet",
    subject: "Math",
    gradeLevel: "Primary",
    content: "",
  });

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
    }
  }, [initialData]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="resource-upload-form">
      <div className="form-group">
        <label htmlFor="title">Title</label>
        <input
          type="text"
          id="title"
          name="title"
          placeholder="e.g. Fractions Worksheet"
          value={formData.title}
          onChange={handleChange}
          disabled={isSaving}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="description">Short Summary</label>
        <input
          type="text"
          id="description"
          name="description"
          placeholder="e.g. Introduction to adding fractions with like denominators"
          value={formData.description}
          onChange={handleChange}
          disabled={isSaving}
        />
      </div>

      <div className="form-row-three">
        <div className="form-group">
          <label htmlFor="category">Category</label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            disabled={isSaving}
            required
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="subject">Subject</label>
          <select
            id="subject"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            disabled={isSaving}
            required
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
            required
          >
            {GRADES.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="content">Resource Content / Lesson Text</label>
        <textarea
          id="content"
          name="content"
          placeholder="Paste or write the lesson material, worksheet problems, or activity instructions here..."
          value={formData.content}
          onChange={handleChange}
          rows={8}
          disabled={isSaving}
          required
        />
      </div>

      <div className="form-actions">
        <button type="button" className="btn-secondary" onClick={onCancel} disabled={isSaving}>
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={isSaving}>
          {isSaving ? (
            <>
              <span className="btn-spinner" /> {submitText}
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
