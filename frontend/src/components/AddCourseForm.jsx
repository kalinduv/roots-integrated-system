import { useState, useEffect } from 'react';

const EMPTY_FORM = { name: '', id: '', teacher: '', level: '', date: '', start: '', end: '' };

/**
 * AddCourseForm – used for both creating and editing a course.
 * Props:
 *  - onAdd(formData)  – called when form is submitted
 *  - initialData      – pre-fills the form when editing
 *  - loading          – disables the submit button while saving
 */
export default function AddCourseForm({ onAdd, initialData, loading }) {
  const [form, setForm] = useState(EMPTY_FORM);

  // Sync form when initialData changes (edit mode)
  useEffect(() => {
    setForm(initialData ? { ...EMPTY_FORM, ...initialData } : EMPTY_FORM);
  }, [initialData]);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (form.name && form.id && form.teacher) {
      onAdd(form);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label className="form-label">Course Name *</label>
        <input className="form-input" name="name" placeholder="e.g., Grade 10 Science"
          value={form.name} onChange={handleChange} required />
      </div>

      <div className="form-group">
        <label className="form-label">Course ID *</label>
        <input className="form-input" name="id" placeholder="e.g., SCI10-01"
          value={form.id} onChange={handleChange} required />
      </div>

      <div className="form-group">
        <label className="form-label">Teacher *</label>
        <input className="form-input" name="teacher" placeholder="Teacher name"
          value={form.teacher} onChange={handleChange} required />
      </div>

      <div className="form-group">
        <label className="form-label">Course Level</label>
        <select className="form-input" name="level" value={form.level} onChange={handleChange}>
          <option value="">Select Level</option>
          <option value="Grade 6">Grade 6</option>
          <option value="Grade 7">Grade 7</option>
          <option value="Grade 8">Grade 8</option>
          <option value="Grade 9">Grade 9</option>
          <option value="Grade 10">Grade 10</option>
          <option value="Grade 11">Grade 11</option>
          <option value="A/L">A/L</option>
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">Class Day</label>
        <select className="form-input" name="date" value={form.date} onChange={handleChange}>
          <option value="">Select Day</option>
          {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map(d => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">Start Time</label>
        <input className="form-input" name="start" placeholder="e.g., 8:00 a.m"
          value={form.start} onChange={handleChange} />
      </div>

      <div className="form-group">
        <label className="form-label">End Time</label>
        <input className="form-input" name="end" placeholder="e.g., 10:00 a.m"
          value={form.end} onChange={handleChange} />
      </div>

      <button type="submit" className="btn-primary" disabled={loading}>
        {loading ? 'Saving…' : initialData ? 'Update Course' : 'Add Course'}
      </button>
    </form>
  );
}
