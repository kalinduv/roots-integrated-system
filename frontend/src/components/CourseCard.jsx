/**
 * CourseCard – displays a single course with edit & delete actions.
 */
export default function CourseCard({ course, onEdit, onDelete }) {
  return (
    <div className="card">
      {/* Header */}
      <div className="card-head">
        <div>
          <p className="card-name">{course.name}</p>
          <p className="card-id">ID: {course.id}</p>
        </div>
        <span className="card-icon">📚</span>
      </div>

      {/* Info rows */}
      <div className="card-info">
        <div className="info-row">
          <span className="info-lbl">Teacher</span>
          <span className="info-val">{course.teacher}</span>
        </div>
        <div className="info-row">
          <span className="info-lbl">Date</span>
          <span className="info-val">{course.date || '—'}</span>
        </div>
        <div className="info-row">
          <span className="info-lbl">Time</span>
          <span className="info-val">
            {course.start && course.end ? `${course.start} – ${course.end}` : '—'}
          </span>
        </div>
        {course.level && (
          <div className="info-row">
            <span className="info-lbl">Level</span>
            <span className="info-val">{course.level}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="card-actions">
        <button className="act-btn act-btn-edit"  onClick={() => onEdit(course)}>
          ✏️ Edit
        </button>
        <button className="act-btn act-btn-delete" onClick={() => onDelete(course.docId)}>
          🗑️ Delete
        </button>
      </div>
    </div>
  );
}
