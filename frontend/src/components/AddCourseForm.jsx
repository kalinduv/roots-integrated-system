import { useState, useEffect, useRef } from 'react';
import { API_BASE } from '../config';

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
  const [teachers, setTeachers] = useState([]);
  const [staff, setStaff] = useState([]);
  const [teacherSuggestionsOpen, setTeacherSuggestionsOpen] = useState(false);
  const teacherInputRef = useRef(null);

  // Sync form when initialData changes (edit mode)
  useEffect(() => {
    setForm(initialData ? { ...EMPTY_FORM, ...initialData } : EMPTY_FORM);
  }, [initialData]);

  // Fetch teachers and staff data
  useEffect(() => {
    const fetchTeachersAndStaff = async () => {
      try {
        const [teachersRes, staffRes] = await Promise.all([
          fetch(`${API_BASE}/api/teachers`),
          fetch(`${API_BASE}/api/staff`)
        ]);
        const teachersData = await teachersRes.json();
        const staffData = await staffRes.json();
        setTeachers(Array.isArray(teachersData) ? teachersData : []);
        setStaff(Array.isArray(staffData) ? staffData : []);
      } catch (error) {
        console.error('Error fetching teachers and staff:', error);
      }
    };
    fetchTeachersAndStaff();
  }, []);

  // Create teacher suggestions
  const teacherSuggestions = [...teachers, ...staff]
    .filter((person) => {
      const query = form.teacher.trim().toLowerCase();
      if (!query) return false;
      
      const name = String(person.name || '').toLowerCase();
      const id = String(person.id || person.staffId || person.teacherId || '').toLowerCase();
      
      return name.includes(query) || id.includes(query);
    })
    .map((person) => ({
      id: person.id || person.staffId || person.teacherId || '',
      name: person.name || '',
      type: teachers.includes(person) ? 'Teacher' : 'Staff'
    }));

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleTeacherChange = (value) => {
    setForm((prev) => ({ ...prev, teacher: value }));
    setTeacherSuggestionsOpen(true);
  };

  const handleSelectTeacher = (teacher) => {
    setForm((prev) => ({ ...prev, teacher: teacher.name }));
    setTeacherSuggestionsOpen(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (form.name && form.teacher) {
      // ID is required only when editing; for new courses it's auto-generated
      if (initialData && !form.id) return;
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
        {initialData ? (
          // Editing mode: show ID as read-only
          <input className="form-input bg-gray-100" name="id" value={form.id} readOnly />
        ) : (
          // Adding mode: hide ID field since it's auto-generated
          <div className="form-input bg-gray-50 text-gray-500 italic">
            Auto-generated (C100, C101, etc.)
          </div>
        )}
      </div>

      <div className="form-group">
        <label className="form-label">Teacher *</label>
        <div ref={teacherInputRef} className="relative">
          <input 
            className="form-input" 
            name="teacher" 
            placeholder="Start typing to search teachers/staff"
            value={form.teacher} 
            onChange={(e) => handleTeacherChange(e.target.value)}
            onFocus={() => setTeacherSuggestionsOpen(true)}
            required 
            autoComplete="off"
          />
          {teacherSuggestionsOpen && form.teacher.trim().length > 0 && (
            <div className="absolute z-50 top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-xl">
              {teacherSuggestions.length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-500">No teachers/staff found</div>
              ) : (
                teacherSuggestions.map((teacher) => (
                  <button
                    key={`${teacher.type}-${teacher.id}`}
                    type="button"
                    onMouseDown={() => handleSelectTeacher(teacher)}
                    className="w-full text-left px-4 py-2 text-sm border-b border-gray-100 hover:bg-gray-50 transition-colors flex justify-between items-center"
                  >
                    <span className="font-medium">{teacher.name}</span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      teacher.type === 'Teacher' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {teacher.type}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
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
