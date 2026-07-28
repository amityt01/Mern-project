function StudentCard({ student, onEdit, onDelete }) {
  // Use a nice placeholder color based on the first letter of the name
  const firstLetter = student.name ? student.name.charAt(0).toUpperCase() : "?";
  const avatarColors = [
    "avatar-pink",
    "avatar-purple",
    "avatar-blue",
    "avatar-teal",
    "avatar-orange",
  ];
  const charCode = firstLetter.charCodeAt(0) || 0;
  const avatarClass = avatarColors[charCode % avatarColors.length];

  return (
    <div className="student-card">
      <div className="card-header">
        <div className={`avatar ${avatarClass}`}>
          {firstLetter}
        </div>
        <div className="header-info">
          <h3>{student.name}</h3>
          <span className="badge">Age {student.age}</span>
        </div>
      </div>
      <div className="card-body">
        <div className="info-item">
          <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
          <span className="email">{student.email}</span>
        </div>
      </div>
      <div className="card-actions">
        <button className="btn-icon btn-edit" onClick={() => onEdit(student)} title="Edit Student">
          <svg className="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          Edit
        </button>
        <button className="btn-icon btn-delete" onClick={() => onDelete(student._id)} title="Delete Student">
          <svg className="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            <line x1="10" y1="11" x2="10" y2="17" />
            <line x1="14" y1="11" x2="14" y2="17" />
          </svg>
          Delete
        </button>
      </div>
    </div>
  );
}

export default StudentCard;