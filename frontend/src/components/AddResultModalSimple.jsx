
import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { API_BASE } from '../config';

const emptyForm = {
  studentId: '',
  studentName: '',
  course: '',
  mcqMarks: '',
  essayMarks: '',
};

/* ─── Generic Searchable Dropdown ───────────────────────────────────────── */
function SearchableSelect({ label, value, onChange, options, placeholder, disabled, error }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = options.filter((opt) =>
    (opt.label || '').toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (opt) => {
    setQuery(opt.label);
    setOpen(false);
    onChange(opt);
  };

  const handleInputChange = (e) => {
    setQuery(e.target.value);
    setOpen(true);
    if (!e.target.value) onChange({ value: '', label: '', extra: '' });
  };

  return (
    <div ref={ref} className="w-full">
      <label className="block text-[15px] font-semibold text-gray-900 mb-2">{label}</label>
      <div className="relative">
        <input
          className={`w-full h-14 px-5 rounded-full border bg-white focus:outline-none transition-all ${
            error ? 'border-red-500' : 'border-gray-400'
          }`}
          value={query}
          onChange={handleInputChange}
          onFocus={() => !disabled && setOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => !disabled && setOpen((o) => !o)}
          className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500"
        >
          <ChevronDown size={20} />
        </button>

        {open && (
          <div className="absolute z-[10000] top-[110%] left-0 right-0 bg-white border border-gray-300 rounded-[20px] shadow-2xl max-h-[200px] overflow-y-auto custom-scrollbar">
            {filtered.length === 0 ? (
              <div className="p-4 text-gray-400 text-sm">No results found</div>
            ) : (
              filtered.map((opt) => (
                <div
                  key={opt.value}
                  onMouseDown={() => handleSelect(opt)}
                  className="p-3 cursor-pointer text-sm border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors"
                >
                  <span className="font-bold">{opt.value}</span>
                  {opt.extra && <span className="text-gray-500 ml-2">– {opt.extra}</span>}
                </div>
              ))
            )}
          </div>
        )}
      </div>
      {error && <p className="text-red-500 text-xs mt-1 ml-4">{error}</p>}
    </div>
  );
}

/* ─── Main Modal ─────────────────────────────────────────────────────────── */
export default function AddResultModalSimple({ open, onClose, onSave, initialData }) {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [showLockedWarning, setShowLockedWarning] = useState(false);
  const [students, setStudents] = useState([]);
  const [allCourses, setAllCourses] = useState([]);   // full courses list from API
  const [filteredCourses, setFilteredCourses] = useState([]);  // only student's enrolled courses
  const [loading, setLoading] = useState(false);
  const [coursesLoading, setCoursesLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(initialData ? { ...emptyForm, ...initialData } : emptyForm);
      setErrors({});
      setShowLockedWarning(false);
    }
  }, [initialData, open]);

  useEffect(() => {
    if (!open) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const [stuRes, crsRes] = await Promise.all([
          fetch(`${API_BASE}/api/students`),
          fetch(`${API_BASE}/api/courses`),
        ]);
        const stuData = await stuRes.json();
        const crsData = await crsRes.json();
        setStudents(Array.isArray(stuData) ? stuData : []);
        setAllCourses(Array.isArray(crsData) ? crsData : []);
        // When editing, resolve enrolled courses for the pre-filled student
        if (initialData && initialData.studentId) {
          const student = (Array.isArray(stuData) ? stuData : []).find(
            (s) => (s.studentId || s.id || '').trim() === (initialData.studentId || '').trim()
          );
          const enrolled = Array.isArray(student?.selectedCourses) ? student.selectedCourses : [];
          const courseList = Array.isArray(crsData) ? crsData : [];
          setFilteredCourses(
            enrolled.length > 0
              ? courseList.filter((c) => enrolled.includes(c.name || c.courseName || c.title || ''))
              : courseList  // fallback: show all if no enrolled data
          );
        } else {
          setFilteredCourses([]);
        }
      } catch (err) {
        console.error('Failed to load students/courses:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [open]);

  const isHeaderComplete = !!(form.studentId && form.studentName && form.course);

  useEffect(() => {
    if (isHeaderComplete) setShowLockedWarning(false);
  }, [isHeaderComplete]);

  if (!open) return null;

  const studentOptions = students.map((s) => ({
    value: s.studentId || s.id || '',
    label: `${s.studentId || s.id || ''} – ${s.name || ''}`,
    extra: s.name || '',
    // carry enrolled courses so we can resolve them without another fetch
    enrolledCourses: Array.isArray(s.selectedCourses) ? s.selectedCourses : [],
  }));

  const courseOptions = filteredCourses.map((c) => ({
    value: c.name || c.courseName || c.title || '',
    label: c.id ? `${c.name || c.courseName || c.title} (${c.id})` : (c.name || c.courseName || c.title || ''),
    extra: '',
  }));

  const handleStudentSelect = (opt) => {
    setCoursesLoading(true);
    setFilteredCourses([]);
    setForm((prev) => ({
      ...prev,
      studentId: opt.value,
      studentName: opt.extra,
      course: '',          // reset course when student changes
    }));
    setErrors((prev) => ({ ...prev, studentId: '', studentName: '', course: '' }));

    // Resolve enrolled courses from already-fetched students list
    const enrolled = opt.enrolledCourses || [];
    const resolved =
      enrolled.length > 0
        ? allCourses.filter((c) =>
            enrolled.includes(c.name || c.courseName || c.title || '')
          )
        : [];                 // empty = no enrolled courses found
    setFilteredCourses(resolved);
    setCoursesLoading(false);
  };

  const handleCourseSelect = (opt) => {
    setForm((prev) => ({ ...prev, course: opt.value }));
    setErrors((prev) => ({ ...prev, course: '' }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!form.studentId) newErrors.studentId = 'Required';
    if (!form.course) newErrors.course = 'Required';
    
    if (isHeaderComplete) {
      if (!form.mcqMarks) newErrors.mcqMarks = 'Required';
      else if (form.mcqMarks < 0 || form.mcqMarks > 100) newErrors.mcqMarks = 'Marks should be between 0-100';
      
      if (!form.essayMarks) newErrors.essayMarks = 'Required';
      else if (form.essayMarks < 0 || form.essayMarks > 100) newErrors.essayMarks = 'Marks should be between 0-100';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    onSave(form);
  };

  return (
    <div className="overlay scale-in">
      <div className="bg-white rounded-[32px] p-8 w-full max-w-2xl shadow-2xl border border-gray-100 relative">
        <h2 className="text-4xl font-bold text-black text-center mb-8">
          {initialData ? 'Update Exam Result' : 'Add New Exam Result'}
        </h2>

        {loading && <p className="text-center text-purple-600 mb-4 animate-pulse text-sm">Loading data...</p>}

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            <SearchableSelect
              label="Student ID"
              value={form.studentId}
              onChange={handleStudentSelect}
              options={studentOptions}
              placeholder="Search ID..."
              error={errors.studentId}
            />

            <div>
              <label className="block text-[15px] font-semibold text-gray-900 mb-2">Student Name</label>
              <input
                className="w-full h-14 px-5 rounded-full border border-gray-400 bg-gray-50 focus:outline-none text-gray-700 cursor-not-allowed"
                value={form.studentName}
                readOnly
                placeholder="Auto-filled"
              />
            </div>

            {/* Course dropdown — only active after student is selected */}
            <div>
              {coursesLoading && (
                <p className="text-center text-purple-500 text-xs animate-pulse mb-1">
                  Loading enrolled courses…
                </p>
              )}
              {!form.studentId && (
                <p className="text-[13px] text-gray-400 text-center mb-1">
                  ⚠️ Select a student first to see available courses
                </p>
              )}
              {form.studentId && !coursesLoading && filteredCourses.length === 0 && (
                <p className="text-[13px] text-amber-600 text-center mb-1 font-medium">
                  ⚠️ No courses available for this student
                </p>
              )}
              <SearchableSelect
                label="Course"
                value={form.course}
                onChange={handleCourseSelect}
                options={courseOptions}
                placeholder={!form.studentId ? 'Select a student first…' : 'Select course…'}
                error={errors.course}
                disabled={!form.studentId || coursesLoading}
              />
            </div>

            <div className="relative pt-2" onClick={() => !isHeaderComplete && setShowLockedWarning(true)}>
              {showLockedWarning && !isHeaderComplete && (
                <div className="absolute -top-2 left-0 right-0 text-center z-20">
                  <span className="bg-red-50 text-red-600 border border-red-200 px-4 py-1.5 rounded-full text-xs font-bold animate-bounce shadow-sm">
                    ⚠️ Complete above field to add the Results
                  </span>
                </div>
              )}

              <div className={`grid grid-cols-2 gap-6 transition-all duration-300 ${!isHeaderComplete ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
                <div>
                  <label className="block text-[15px] font-semibold text-gray-900 mb-2">MCQ Marks</label>
                  <input
                    type="number"
                    name="mcqMarks"
                    className={`w-full h-14 px-5 rounded-full border bg-white focus:outline-none transition-all ${errors.mcqMarks ? 'border-red-500' : 'border-gray-400'}`}
                    value={form.mcqMarks}
                    onChange={handleChange}
                    placeholder="Marks should be between 0-100"
                  />
                  {errors.mcqMarks && <p className="text-red-500 text-xs mt-1 ml-4">{errors.mcqMarks}</p>}
                </div>
                <div>
                  <label className="block text-[15px] font-semibold text-gray-900 mb-2">Essay Marks</label>
                  <input
                    type="number"
                    name="essayMarks"
                    className={`w-full h-14 px-5 rounded-full border bg-white focus:outline-none transition-all ${errors.essayMarks ? 'border-red-500' : 'border-gray-400'}`}
                    value={form.essayMarks}
                    onChange={handleChange}
                    placeholder="Marks should be between 0-100"
                  />
                  {errors.essayMarks && <p className="text-red-500 text-xs mt-1 ml-4">{errors.essayMarks}</p>}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between gap-6 mt-10">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 h-14 rounded-full border border-gray-300 bg-white text-gray-700 text-xl font-medium transition-colors hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-1/2 h-14 rounded-full bg-[#3F1559] text-white text-xl font-bold transition-all shadow-lg hover:bg-[#2e0f41] active:transform active:scale-95"
            >
              {initialData ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
