import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  updateUserProfile,
  changeUserPassword,
  clearAuthError,
  clearSuccessMessage,
} from "../store/authSlice";
import { addToast } from "../store/toastSlice";

const AVATAR_PRESETS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=250",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=250",
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=250",
];

const SUBJECT_OPTIONS = [
  "Mathematics",
  "Science & Technology",
  "English & Literature",
  "History & Civics",
  "Computer Science",
  "Arts & Craft",
  "Environmental Studies",
  "Special Education",
];

export default function UserProfile() {
  const dispatch = useDispatch();
  const { user, token, isLoading, error, updateSuccessMessage } = useSelector(
    (state) => state.auth
  );

  const [activeTab, setActiveTab] = useState("view"); // 'view' | 'edit' | 'security'

  // Profile Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    schoolName: "",
    role: "Educator",
    phone: "",
    bio: "",
    avatar: "",
    subjects: [],
  });

  // Password Change State
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // UI state
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [passwordErrors, setPasswordErrors] = useState({});

  // Populate form with current user data
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        schoolName: user.schoolName || "",
        role: user.role || "Lead Educator",
        phone: user.phone || "",
        bio: user.bio || "Dedicated educator empowering students with quality learning resources.",
        avatar: user.avatar || AVATAR_PRESETS[0],
        subjects: user.subjects && user.subjects.length > 0 ? user.subjects : ["Mathematics", "Science & Technology"],
      });
    }
  }, [user]);

  // Clear messages when tab changes
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    dispatch(clearAuthError());
    dispatch(clearSuccessMessage());
    setFormErrors({});
    setPasswordErrors({});
  };

  // Profile field handlers
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubjectToggle = (subj) => {
    setFormData((prev) => {
      const exists = prev.subjects.includes(subj);
      if (exists) {
        return { ...prev, subjects: prev.subjects.filter((s) => s !== subj) };
      } else {
        return { ...prev, subjects: [...prev.subjects, subj] };
      }
    });
  };

  // Profile Form Validation
  const validateProfileForm = () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.name.trim()) {
      errors.name = "Full Name is required.";
    }
    if (!formData.email.trim()) {
      errors.email = "Email Address is required.";
    } else if (!emailRegex.test(formData.email.trim())) {
      errors.email = "Please enter a valid email address (e.g. user@school.org).";
    }
    if (!formData.schoolName.trim()) {
      errors.schoolName = "School / Organization Name is required.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    if (!validateProfileForm()) return;

    dispatch(updateUserProfile(formData)).then((res) => {
      if (!res.error) {
        dispatch(
          addToast({
            type: "success",
            title: "Profile Updated",
            message: "Your profile information has been saved successfully.",
          })
        );
        setActiveTab("view");
      } else {
        dispatch(
          addToast({
            type: "error",
            title: "Update Failed",
            message: res.payload || "Failed to update profile.",
          })
        );
      }
    });
  };

  // Password Change Handlers
  const handlePasswordChangeInput = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
    if (passwordErrors[name]) {
      setPasswordErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, label: "Empty", color: "#6b7280" };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 2) return { score, label: "Weak", color: "#ef4444" };
    if (score <= 4) return { score, label: "Moderate", color: "#f59e0b" };
    return { score, label: "Strong", color: "#10b981" };
  };

  const passwordStrength = getPasswordStrength(passwordData.newPassword);

  const validatePasswordForm = () => {
    const errors = {};
    if (!passwordData.currentPassword) {
      errors.currentPassword = "Current password is required to verify your identity.";
    }
    if (!passwordData.newPassword) {
      errors.newPassword = "New password is required.";
    } else if (passwordData.newPassword.length < 6) {
      errors.newPassword = "New password must be at least 6 characters long.";
    } else if (passwordData.newPassword === passwordData.currentPassword) {
      errors.newPassword = "New password must be different from current password.";
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = "New passwords do not match.";
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleUpdatePassword = (e) => {
    e.preventDefault();
    if (!validatePasswordForm()) return;

    dispatch(
      changeUserPassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      })
    ).then((res) => {
      if (!res.error) {
        dispatch(
          addToast({
            type: "success",
            title: "Password Updated",
            message: "Your password was updated successfully.",
          })
        );
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        dispatch(
          addToast({
            type: "error",
            title: "Password Update Failed",
            message: res.payload || "Failed to update password.",
          })
        );
      }
    });
  };

  // Calculate profile completion percentage
  const getProfileCompletion = () => {
    if (!user) return 0;
    let score = 0;
    if (formData.name) score += 20;
    if (formData.email) score += 20;
    if (formData.schoolName) score += 20;
    if (formData.role) score += 10;
    if (formData.phone) score += 10;
    if (formData.bio) score += 10;
    if (formData.subjects && formData.subjects.length > 0) score += 10;
    return score;
  };

  const completion = getProfileCompletion();

  if (!user) {
    return (
      <div className="profile-container empty-state">
        <h2>No Active User Session</h2>
        <p>Please log in or register to view and edit your profile info.</p>
      </div>
    );
  }

  return (
    <div className="profile-wrapper">
      {/* Alert Banners */}
      {error && (
        <div className="profile-alert alert-danger">
          <div className="alert-content">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="alert-icon">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
          <button className="alert-close" onClick={() => dispatch(clearAuthError())}>&times;</button>
        </div>
      )}

      {updateSuccessMessage && (
        <div className="profile-alert alert-success">
          <div className="alert-content">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="alert-icon">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span>{updateSuccessMessage}</span>
          </div>
          <button className="alert-close" onClick={() => dispatch(clearSuccessMessage())}>&times;</button>
        </div>
      )}

      {/* Main Profile Header Card */}
      <div className="profile-header-card">
        <div className="profile-header-cover"></div>
        <div className="profile-header-content">
          <div className="profile-avatar-container">
            <img
              src={formData.avatar || AVATAR_PRESETS[0]}
              alt={formData.name}
              className="profile-avatar-img"
              onError={(e) => {
                e.target.src = AVATAR_PRESETS[0];
              }}
            />
            <span className="profile-status-badge" title="Authenticated User"></span>
          </div>

          <div className="profile-title-block">
            <div className="profile-name-row">
              <h2 className="profile-user-name">{formData.name}</h2>
              <span className="profile-role-chip">{formData.role}</span>
            </div>
            <p className="profile-user-email">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="icon-sm">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              {formData.email}
            </p>
            <p className="profile-user-school">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="icon-sm">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c3 3 9 3 12 0v-5" />
              </svg>
              {formData.schoolName}
            </p>
          </div>

          {/* Profile Completion Widget */}
          <div className="profile-completion-box">
            <div className="completion-header">
              <span>Profile Completeness</span>
              <strong>{completion}%</strong>
            </div>
            <div className="completion-bar">
              <div className="completion-fill" style={{ width: `${completion}%` }}></div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="profile-subtabs">
          <button
            className={`subtab-btn ${activeTab === "view" ? "active" : ""}`}
            onClick={() => handleTabChange("view")}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="icon-tab">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            Profile Overview
          </button>
          <button
            className={`subtab-btn ${activeTab === "edit" ? "active" : ""}`}
            onClick={() => handleTabChange("edit")}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="icon-tab">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Edit Profile
          </button>
          <button
            className={`subtab-btn ${activeTab === "security" ? "active" : ""}`}
            onClick={() => handleTabChange("security")}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="icon-tab">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            Password & Security
          </button>
        </div>
      </div>

      {/* TAB 1: DISPLAY / VIEW PROFILE */}
      {activeTab === "view" && (
        <div className="profile-tab-body fade-in">
          <div className="profile-grid">
            {/* Primary Details Card */}
            <div className="profile-card">
              <div className="card-header">
                <h3>Personal Information</h3>
                <button
                  className="btn-edit-shortcut"
                  onClick={() => handleTabChange("edit")}
                >
                  Edit Details ✎
                </button>
              </div>

              <div className="detail-list">
                <div className="detail-item">
                  <span className="detail-label">Full Name</span>
                  <span className="detail-value font-medium">{formData.name}</span>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Email Address</span>
                  <div className="detail-value-group">
                    <span className="detail-value">{formData.email}</span>
                    <span className="verified-badge">✓ Verified</span>
                  </div>
                </div>

                <div className="detail-item">
                  <span className="detail-label">School / Institution</span>
                  <span className="detail-value">{formData.schoolName}</span>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Role & Designation</span>
                  <span className="detail-value">{formData.role}</span>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Contact Phone</span>
                  <span className="detail-value">
                    {formData.phone || <em className="text-muted">Not specified</em>}
                  </span>
                </div>
              </div>
            </div>

            {/* Bio & Focus Areas Card */}
            <div className="profile-card">
              <div className="card-header">
                <h3>Bio & Specializations</h3>
              </div>

              <div className="bio-section">
                <label className="detail-label">About Me</label>
                <p className="bio-text">
                  {formData.bio || "No biography provided."}
                </p>
              </div>

              <div className="subjects-section">
                <label className="detail-label">Teaching & Focus Subjects</label>
                <div className="subject-tags-container">
                  {formData.subjects && formData.subjects.length > 0 ? (
                    formData.subjects.map((subj, i) => (
                      <span key={i} className="subject-pill">
                        📚 {subj}
                      </span>
                    ))
                  ) : (
                    <em className="text-muted">No subjects selected</em>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Account Meta Footer */}
          <div className="profile-card meta-card">
            <div className="meta-grid">
              <div>
                <span className="meta-title">Account Member ID</span>
                <code className="meta-code">{user.id || user._id || "USR-2026-X89"}</code>
              </div>
              <div>
                <span className="meta-title">Member Since</span>
                <span className="meta-desc">
                  {user.createdAt
                    ? new Date(user.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "July 2026"}
                </span>
              </div>
              <div>
                <span className="meta-title">Security Status</span>
                <span className="meta-desc text-success">Active JWT Session</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: EDIT PROFILE FORM */}
      {activeTab === "edit" && (
        <form onSubmit={handleSaveProfile} className="profile-tab-body fade-in">
          <div className="profile-card">
            <div className="card-header">
              <h3>Edit Profile Information</h3>
              <p className="card-subtext">Update your personal information and contact details below.</p>
            </div>

            {/* Avatar Selector */}
            <div className="form-group avatar-picker-group">
              <label>Select Profile Avatar:</label>
              <div className="avatar-presets">
                {AVATAR_PRESETS.map((url, idx) => (
                  <img
                    key={idx}
                    src={url}
                    alt={`Preset ${idx + 1}`}
                    className={`preset-avatar ${formData.avatar === url ? "selected" : ""}`}
                    onClick={() => setFormData((prev) => ({ ...prev, avatar: url }))}
                  />
                ))}
              </div>
              <div className="custom-url-input">
                <input
                  type="url"
                  name="avatar"
                  value={formData.avatar}
                  onChange={handleFormChange}
                  placeholder="Or paste custom image URL (https://...)"
                  className="form-control"
                />
              </div>
            </div>

            <div className="form-grid-2col">
              {/* Editable Name */}
              <div className={`form-group ${formErrors.name ? "has-error" : ""}`}>
                <label htmlFor="profile-name">
                  Full Name <span className="req">*</span>
                </label>
                <input
                  id="profile-name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  placeholder="e.g. Dr. Jane Doe"
                  className="form-control"
                />
                {formErrors.name && <span className="field-error">{formErrors.name}</span>}
              </div>

              {/* Editable Email */}
              <div className={`form-group ${formErrors.email ? "has-error" : ""}`}>
                <label htmlFor="profile-email">
                  Email Address <span className="req">*</span>
                </label>
                <input
                  id="profile-email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleFormChange}
                  placeholder="teacher@school.org"
                  className="form-control"
                />
                {formErrors.email && <span className="field-error">{formErrors.email}</span>}
              </div>

              {/* School Name */}
              <div className={`form-group ${formErrors.schoolName ? "has-error" : ""}`}>
                <label htmlFor="profile-school">
                  School / Institution Name <span className="req">*</span>
                </label>
                <input
                  id="profile-school"
                  type="text"
                  name="schoolName"
                  value={formData.schoolName}
                  onChange={handleFormChange}
                  placeholder="Valley View High School"
                  className="form-control"
                />
                {formErrors.schoolName && <span className="field-error">{formErrors.schoolName}</span>}
              </div>

              {/* Role / Designation */}
              <div className="form-group">
                <label htmlFor="profile-role">Role / Designation</label>
                <select
                  id="profile-role"
                  name="role"
                  value={formData.role}
                  onChange={handleFormChange}
                  className="form-control"
                >
                  <option value="Lead Educator">Lead Educator</option>
                  <option value="STEM Coordinator">STEM Coordinator</option>
                  <option value="School Principal">School Principal</option>
                  <option value="Resource Manager">Resource Manager</option>
                  <option value="Volunteer Instructor">Volunteer Instructor</option>
                </select>
              </div>

              {/* Phone Number */}
              <div className="form-group">
                <label htmlFor="profile-phone">Contact Phone Number</label>
                <input
                  id="profile-phone"
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleFormChange}
                  placeholder="+1 (555) 019-2834"
                  className="form-control"
                />
              </div>
            </div>

            {/* Bio */}
            <div className="form-group">
              <label htmlFor="profile-bio">About / Bio</label>
              <textarea
                id="profile-bio"
                name="bio"
                rows={3}
                value={formData.bio}
                onChange={handleFormChange}
                placeholder="Share a short bio about your educational role and mission..."
                className="form-control"
              />
            </div>

            {/* Teaching Subjects */}
            <div className="form-group">
              <label>Select Focus / Teaching Subjects:</label>
              <div className="subject-chip-grid">
                {SUBJECT_OPTIONS.map((subj) => {
                  const isSelected = formData.subjects.includes(subj);
                  return (
                    <button
                      key={subj}
                      type="button"
                      className={`subject-chip-btn ${isSelected ? "active" : ""}`}
                      onClick={() => handleSubjectToggle(subj)}
                    >
                      {isSelected ? "✓ " : "+ "}
                      {subj}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="form-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => handleTabChange("view")}
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <span className="btn-spinner"></span> Saving Changes...
                  </>
                ) : (
                  "Save Profile Changes"
                )}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* TAB 3: PASSWORD & SECURITY */}
      {activeTab === "security" && (
        <div className="profile-tab-body fade-in">
          <form onSubmit={handleUpdatePassword} className="profile-card">
            <div className="card-header">
              <h3>Change Password</h3>
              <p className="card-subtext">Ensure your account uses a strong and unique password.</p>
            </div>

            <div className="security-form-fields">
              {/* Current Password */}
              <div className={`form-group ${passwordErrors.currentPassword ? "has-error" : ""}`}>
                <label htmlFor="current-pass">Current Password <span className="req">*</span></label>
                <div className="password-input-wrapper">
                  <input
                    id="current-pass"
                    type={showCurrentPass ? "text" : "password"}
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChangeInput}
                    placeholder="Enter current password"
                    className="form-control"
                  />
                  <button
                    type="button"
                    className="pass-toggle-btn"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    title={showCurrentPass ? "Hide password" : "Show password"}
                  >
                    {showCurrentPass ? "🙈" : "👁️"}
                  </button>
                </div>
                {passwordErrors.currentPassword && (
                  <span className="field-error">{passwordErrors.currentPassword}</span>
                )}
              </div>

              {/* New Password */}
              <div className={`form-group ${passwordErrors.newPassword ? "has-error" : ""}`}>
                <label htmlFor="new-pass">New Password <span className="req">*</span></label>
                <div className="password-input-wrapper">
                  <input
                    id="new-pass"
                    type={showNewPass ? "text" : "password"}
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChangeInput}
                    placeholder="At least 6 characters"
                    className="form-control"
                  />
                  <button
                    type="button"
                    className="pass-toggle-btn"
                    onClick={() => setShowNewPass(!showNewPass)}
                    title={showNewPass ? "Hide password" : "Show password"}
                  >
                    {showNewPass ? "🙈" : "👁️"}
                  </button>
                </div>

                {/* Password Strength Meter */}
                {passwordData.newPassword && (
                  <div className="strength-meter-box">
                    <div className="strength-bar-track">
                      <div
                        className="strength-bar-fill"
                        style={{
                          width: `${(passwordStrength.score / 5) * 100}%`,
                          backgroundColor: passwordStrength.color,
                        }}
                      ></div>
                    </div>
                    <span className="strength-label" style={{ color: passwordStrength.color }}>
                      Strength: <strong>{passwordStrength.label}</strong>
                    </span>
                  </div>
                )}

                {passwordErrors.newPassword && (
                  <span className="field-error">{passwordErrors.newPassword}</span>
                )}
              </div>

              {/* Confirm New Password */}
              <div className={`form-group ${passwordErrors.confirmPassword ? "has-error" : ""}`}>
                <label htmlFor="confirm-pass">Confirm New Password <span className="req">*</span></label>
                <div className="password-input-wrapper">
                  <input
                    id="confirm-pass"
                    type={showConfirmPass ? "text" : "password"}
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChangeInput}
                    placeholder="Re-enter new password"
                    className="form-control"
                  />
                  <button
                    type="button"
                    className="pass-toggle-btn"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    title={showConfirmPass ? "Hide password" : "Show password"}
                  >
                    {showConfirmPass ? "🙈" : "👁️"}
                  </button>
                </div>
                {passwordErrors.confirmPassword && (
                  <span className="field-error">{passwordErrors.confirmPassword}</span>
                )}
              </div>

              {/* Submit */}
              <div className="form-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => handleTabChange("view")}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <span className="btn-spinner"></span> Updating Password...
                    </>
                  ) : (
                    "Update Password"
                  )}
                </button>
              </div>
            </div>
          </form>

          {/* Session Info */}
          <div className="profile-card session-info-card">
            <div className="card-header">
              <h3>Active Session Details</h3>
            </div>
            <div className="session-info-grid">
              <div className="session-item">
                <span className="session-label">Authentication Token</span>
                <span className="session-val">JSON Web Token (JWT)</span>
              </div>
              <div className="session-item">
                <span className="session-label">Algorithm</span>
                <span className="session-val">HS256 (HMAC SHA-256)</span>
              </div>
              <div className="session-item">
                <span className="session-label">Status</span>
                <span className="session-val text-success">● Active & Secure</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
