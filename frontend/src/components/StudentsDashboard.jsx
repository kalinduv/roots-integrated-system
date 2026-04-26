import React, { useEffect, useState } from 'react';
import { API_BASE } from '../config';
import { logActivity } from '../utils/activityLogger';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const StudentsDashboard = () => {
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditingId, setIsEditingId] = useState(null);
  const [formError, setFormError] = useState('');
  const [reportDropdownOpen, setReportDropdownOpen] = useState(false);
  const [courseDropdownOpen, setCourseDropdownOpen] = useState(false);
  const [courseSearch, setCourseSearch] = useState('');

  const [formData, setFormData] = useState({
    studentId: '',
    name: '',
    email: '',
    phone: '',
    selectedCourses: [],
    date: '',
  });

  useEffect(() => {
    fetchStudents();
    fetchCourses();
  }, []);

  // Close course dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (!e.target.closest('#course-picker-container')) {
        setCourseDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const normalizeStudent = (student) => ({
    ...student,
    docId: student.docId || student.firestoreId || student._id || '',
    studentId: student.studentId || student.id || '',
    // normalize courseDetails -> always an array
    selectedCourses: Array.isArray(student.selectedCourses)
      ? student.selectedCourses
      : student.courseDetails
        ? [student.courseDetails]
        : [],
  });

  const fetchStudents = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/students`);
      const data = await response.json();
      const normalized = Array.isArray(data) ? data.map(normalizeStudent) : [];
      setStudents(normalized);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/courses`);
      const data = await response.json();
      setCourses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const generateStudentId = () => {
    if (students.length === 0) return 'STU001';
    const ids = students
      .map(s => s.studentId || s.id)
      .filter(id => id && id.startsWith('STU'))
      .map(id => parseInt(id.replace('STU', ''), 10))
      .filter(num => !isNaN(num));
    if (ids.length === 0) return 'STU001';
    const maxId = Math.max(...ids);
    return `STU${(maxId + 1).toString().padStart(3, '0')}`;
  };

  const resetForm = () => {
    setFormData({
      studentId: generateStudentId(),
      name: '',
      email: '',
      phone: '',
      selectedCourses: [],
      date: new Date().toISOString().split('T')[0],
    });
    setIsEditingId(null);
    setFormError('');
    setCourseDropdownOpen(false);
    setCourseSearch('');
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleInputChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const toggleCourse = (courseName) => {
    setFormData((prev) => {
      const already = prev.selectedCourses.includes(courseName);
      return {
        ...prev,
        selectedCourses: already
          ? prev.selectedCourses.filter(c => c !== courseName)
          : [...prev.selectedCourses, courseName],
      };
    });
  };

  const removeCourseTag = (courseName) => {
    setFormData((prev) => ({
      ...prev,
      selectedCourses: prev.selectedCourses.filter(c => c !== courseName),
    }));
  };

  const validateForm = () => {
    const slPhoneRegex = /^(?:0\d{9}|\+94\d{9})$/;
    if (!slPhoneRegex.test(formData.phone)) {
      return 'Please enter a valid Sri Lankan phone number (e.g., 0712345678 or +94712345678).';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return 'Please enter a valid email address.';
    }
    const idRegex = /^STU\d{3,}$/;
    if (!idRegex.test(formData.studentId)) {
      return 'Student ID must follow the format STUXXX (e.g., STU001).';
    }
    if (!isEditingId) {
      const idExists = students.some(s => (s.studentId || s.id) === formData.studentId);
      if (idExists) return 'Student ID must be unique. This ID already exists.';
    }
    if (formData.selectedCourses.length === 0) {
      return 'Please select at least one course.';
    }
    return null;
  };

  const getCourseDisplayString = (student) => {
    if (Array.isArray(student.selectedCourses) && student.selectedCourses.length > 0) {
      return student.selectedCourses.join(', ');
    }
    return student.courseDetails || '';
  };

  const handleExportPDF = (listType) => {
    const doc = new jsPDF();
    const tableColumn = ["ID", "Name", "Email", "Phone", "Courses", "Date", "Status"];
    const tableRows = [];
    const dataToExport = listType === 'active' ? students.filter(s => s.status) : students;
    dataToExport.forEach(student => {
      tableRows.push([
        student.studentId || '',
        student.name || '',
        student.email || '',
        student.phone || '',
        getCourseDisplayString(student),
        student.date || '',
        student.status ? 'Active' : 'Inactive',
      ]);
    });
    autoTable(doc, { head: [tableColumn], body: tableRows, startY: 20 });
    doc.text(`Roots Institute - ${listType === 'active' ? 'Active ' : ''}Student Report`, 14, 15);
    doc.save(`student_report_${listType}.pdf`);
    setReportDropdownOpen(false);
  };

  const handleExportExcel = (listType) => {
    const dataToExport = listType === 'active' ? students.filter(s => s.status) : students;
    const excelData = dataToExport.map(student => ({
      "Student ID": student.studentId || '',
      "Name": student.name || '',
      "Email": student.email || '',
      "Phone": student.phone || '',
      "Courses": getCourseDisplayString(student),
      "Date Enrolled": student.date || '',
      "Status": student.status ? 'Active' : 'Inactive',
    }));
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Students");
    XLSX.writeFile(workbook, `student_report_${listType}.xlsx`);
    setReportDropdownOpen(false);
  };

  const handleCreateStudent = async (e) => {
    e.preventDefault();
    const errorMsg = validateForm();
    if (errorMsg) { setFormError(errorMsg); return; }
    setFormError('');

    try {
      const existingStudent = students.find((student) => student.docId === isEditingId);
      const payload = {
        id: formData.studentId,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        selectedCourses: formData.selectedCourses,
        courseDetails: formData.selectedCourses.join(', '), // keep legacy field in sync
        date: formData.date,
        status: isEditingId ? existingStudent?.status ?? true : true,
      };

      const url = isEditingId
        ? `${API_BASE}/api/students/${isEditingId}`
        : `${API_BASE}/api/students`;
      const method = isEditingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        logActivity(isEditingId
          ? `Student ${formData.name} was updated.`
          : `Student ${formData.name} was added.`);
        await fetchStudents();
        closeModal();
      } else {
        console.error('Save failed:', await response.text());
      }
    } catch (error) {
      console.error('Error saving student:', error);
    }
  };

  const handleEditStudent = (student) => {
    setFormData({
      studentId: student.studentId || '',
      name: student.name || '',
      email: student.email || '',
      phone: student.phone || '',
      selectedCourses: Array.isArray(student.selectedCourses) ? student.selectedCourses : [],
      date: student.date || '',
    });
    setIsEditingId(student.docId);
    setFormError('');
    setCourseDropdownOpen(false);
    setIsModalOpen(true);
  };

  const handleDeleteStudent = async (studentDocId, studentName) => {
    if (!studentDocId) return;
    if (!window.confirm('Are you sure you want to delete this student?')) return;
    try {
      const response = await fetch(`${API_BASE}/api/students/${studentDocId}`, { method: 'DELETE' });
      if (response.ok) {
        logActivity(`Student ${studentName} was deleted.`);
        await fetchStudents();
      }
    } catch (error) {
      console.error('Error deleting student:', error);
    }
  };

  const handleToggleStatus = async (studentDocId, currentStatus) => {
    const existingStudent = students.find((student) => student.docId === studentDocId);
    if (!existingStudent || !studentDocId) return;
    try {
      const response = await fetch(`${API_BASE}/api/students/${studentDocId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: existingStudent.studentId,
          name: existingStudent.name,
          email: existingStudent.email,
          phone: existingStudent.phone,
          selectedCourses: existingStudent.selectedCourses || [],
          courseDetails: getCourseDisplayString(existingStudent),
          date: existingStudent.date,
          status: !currentStatus,
        }),
      });
      if (response.ok) {
        logActivity(`Student ${existingStudent.name} status changed to ${!currentStatus ? 'active' : 'inactive'}.`);
        await fetchStudents();
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleSendWelcomeEmail = async (studentDocId, studentName) => {
    try {
      const response = await fetch(`${API_BASE}/api/students/${studentDocId}/welcome-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.ok) {
        alert(`Success! Welcome email sent to ${studentName}`);
        logActivity(`Welcome email successfully sent to ${studentName}.`);
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(`Failed to send email: ${errorData.error || 'Check Gmail settings'}`);
      }
    } catch (error) {
      alert(`Network Error: ${error.message}`);
    }
  };

  const filteredStudents = students.filter((student) => {
    const q = searchTerm.toLowerCase();
    return (
      (student.name || '').toLowerCase().includes(q) ||
      String(student.studentId || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden">
      <div className="bg-[#E6E6E6] px-10 py-3 border-b border-gray-300">
        <h2 className="text-xs font-bold text-gray-500 tracking-widest uppercase">STUDENTS</h2>
      </div>

      <div className="px-10 pt-6 pb-5 flex justify-between items-end bg-white">
        <div>
          <h1 className="text-3xl font-bold mb-1 text-gray-900">Students</h1>
          <p className="text-gray-600 text-sm">Manage Student records and information</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              type="button"
              onClick={() => setReportDropdownOpen(!reportDropdownOpen)}
              className="bg-[#B19CD9] hover:bg-[#A38ACF] text-white px-4 py-2.5 rounded-full font-medium shadow-sm flex items-center gap-2 text-sm transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Generate Report
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {reportDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-100 rounded-lg shadow-lg py-2 z-10">
                <div className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Student List</div>
                <button type="button" onClick={() => handleExportPDF('all')} className="block w-full text-left px-5 py-2 text-sm text-gray-700 hover:bg-[#d9cde4] flex justify-between items-center transition-colors">
                  Export to PDF <span className="text-red-500 font-bold text-xs bg-red-50 px-2 py-0.5 rounded">PDF</span>
                </button>
                <button type="button" onClick={() => handleExportExcel('all')} className="block w-full text-left px-5 py-2 text-sm text-gray-700 hover:bg-[#d9cde4] flex justify-between items-center transition-colors">
                  Export to Excel <span className="text-green-600 font-bold text-xs bg-green-50 px-2 py-0.5 rounded">XLS</span>
                </button>
                <div className="h-[1px] bg-gray-100 w-full my-1.5" />
                <div className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Active Students</div>
                <button type="button" onClick={() => handleExportPDF('active')} className="block w-full text-left px-5 py-2 text-sm text-gray-700 hover:bg-[#d9cde4] flex justify-between items-center transition-colors">
                  Export to PDF <span className="text-red-500 font-bold text-xs bg-red-50 px-2 py-0.5 rounded">PDF</span>
                </button>
                <button type="button" onClick={() => handleExportExcel('active')} className="block w-full text-left px-5 py-2 text-sm text-gray-700 hover:bg-[#d9cde4] flex justify-between items-center transition-colors">
                  Export to Excel <span className="text-green-600 font-bold text-xs bg-green-50 px-2 py-0.5 rounded">XLS</span>
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            className="bg-[#3B1155] hover:bg-[#2d0d42] text-white px-5 py-2.5 rounded-full font-medium shadow-sm flex items-center gap-2 text-sm ml-2 transition-colors"
          >
            <span className="text-lg">+</span> Add Student
          </button>
        </div>
      </div>

      <div className="px-10 flex-1 overflow-auto bg-white">
        <div className="mb-8 relative">
          <input
            type="text"
            placeholder="Search student..."
            className="w-full pl-12 pr-4 py-3 rounded-full border border-gray-300 focus:outline-none shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <svg className="w-6 h-6 text-gray-400 absolute left-4 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <div className="bg-white rounded-t-lg overflow-hidden border border-gray-300 shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="bg-stone-300 text-gray-800 text-left text-xs font-semibold border-b border-gray-400">
                <th className="px-3 py-3">Student</th>
                <th className="px-3 py-3">Contact</th>
                <th className="px-3 py-3">Courses</th>
                <th className="px-3 py-3">Date</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-300">
              {filteredStudents.map((student) => (
                <tr key={student.docId || student.studentId} className="text-xs">
                  <td className="px-3 py-3">
                    <div className="font-medium text-gray-900">{student.name}</div>
                    <div className="text-gray-500">{student.studentId}</div>
                  </td>
                  <td className="px-3 py-3 text-gray-700">
                    <div>{student.email}</div>
                    <div>{student.phone}</div>
                  </td>
                  <td className="px-3 py-3 text-gray-700">
                    {(() => {
                      const list = Array.isArray(student.selectedCourses) && student.selectedCourses.length > 0
                        ? student.selectedCourses
                        : student.courseDetails ? [student.courseDetails] : [];
                      return list.length > 0 ? list.join(', ') : '—';
                    })()}
                  </td>
                  <td className="px-3 py-3 text-gray-700">{student.date}</td>
                  <td className="px-3 py-3">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(student.docId, student.status)}
                      className={`relative inline-block w-10 h-5 rounded-full ${student.status ? 'bg-green-500' : 'bg-gray-300'}`}
                    >
                      <span className={`absolute left-1 top-0.5 bg-white w-4 h-4 rounded-full transition-transform ${student.status ? 'translate-x-4' : ''}`} />
                    </button>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => handleEditStudent(student)} className="text-gray-400 hover:text-black transition-colors" title="Edit">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button type="button" onClick={() => handleDeleteStudent(student.docId, student.name)} className="text-gray-400 hover:text-red-500 transition-colors" title="Delete">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                      <button type="button" onClick={() => handleSendWelcomeEmail(student.docId, student.name)} className="text-gray-400 hover:text-blue-500 transition-colors" title="Send Welcome Email">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredStudents.length === 0 && (
            <div className="text-center py-10 text-gray-500">No students found</div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-[#4B1D63]/35 backdrop-blur-[1px] flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-2xl shadow-2xl">
            <h2 className="text-xl font-bold mb-4">
              {isEditingId ? 'Update Student' : 'Add New Student'}
            </h2>

            <form onSubmit={handleCreateStudent}>
              {formError && (
                <div className="mb-3 p-2.5 bg-red-100 text-red-700 rounded-lg text-sm border border-red-200">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 mb-5">
                {/* Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Name</label>
                  <input required type="text" name="name" value={formData.name} onChange={handleInputChange}
                    className="w-full border border-gray-300 bg-white px-4 py-2.5 text-base rounded-xl outline-none focus:ring-2 focus:ring-[#4B1D63]/50 transition-all shadow-sm" />
                </div>

                {/* Student ID */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Student ID</label>
                  <input required type="text" name="studentId" value={formData.studentId} readOnly
                    className="w-full border border-gray-300 bg-gray-50 px-4 py-2.5 text-base rounded-xl outline-none cursor-not-allowed shadow-inner" />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
                  <input required type="email" name="email" value={formData.email} onChange={handleInputChange}
                    className="w-full border border-gray-300 bg-white px-4 py-2.5 text-base rounded-xl outline-none focus:ring-2 focus:ring-[#4B1D63]/50 transition-all shadow-sm" />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone</label>
                  <input required type="text" name="phone" value={formData.phone} onChange={handleInputChange}
                    className="w-full border border-gray-300 bg-white px-4 py-2.5 text-base rounded-xl outline-none focus:ring-2 focus:ring-[#4B1D63]/50 transition-all shadow-sm" />
                </div>

                {/* Date */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Date</label>
                  <input required type="date" name="date" value={formData.date} onChange={handleInputChange}
                    className="w-full border border-gray-300 bg-white px-4 py-2.5 text-base rounded-xl outline-none focus:ring-2 focus:ring-[#4B1D63]/50 transition-all shadow-sm" />
                </div>

                {/* Course Multi-select - spans full width */}
                <div className="col-span-2 relative" id="course-picker-container">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Courses <span className="font-normal text-gray-400">(type to search or add custom)</span>
                  </label>

                  {/* Selected course tags */}
                  {formData.selectedCourses.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {formData.selectedCourses.map((c) => (
                        <span key={c} className="flex items-center gap-1.5 bg-[#4B1D63] text-white text-sm px-3.5 py-1 rounded-full shadow-sm">
                          {c}
                          <button type="button" onClick={() => removeCourseTag(c)} className="hover:text-red-300 leading-none text-lg">×</button>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Search input */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search or type a course name..."
                      value={courseSearch}
                      onChange={(e) => { setCourseSearch(e.target.value); setCourseDropdownOpen(true); }}
                      onFocus={() => setCourseDropdownOpen(true)}
                      className="w-full border border-gray-300 bg-white px-4 py-2.5 pr-10 text-base rounded-xl outline-none focus:ring-2 focus:ring-[#4B1D63]/50 transition-all shadow-sm"
                    />
                    <svg className="w-4 h-4 text-gray-400 absolute right-2.5 top-2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>

                  {/* Dropdown course list */}
                  {courseDropdownOpen && (() => {
                    const filtered = courses.filter(c => {
                      const n = c.name || c.courseName || c.title || '';
                      return n.toLowerCase().includes(courseSearch.toLowerCase());
                    });
                    const trimmed = courseSearch.trim();
                    const exactMatch = courses.some(c =>
                      (c.name || c.courseName || c.title || '').toLowerCase() === trimmed.toLowerCase()
                    );
                    const showCustom = trimmed.length > 0 && !exactMatch;

                    return (
                      <div className="absolute z-20 mt-1 left-0 right-0 max-h-44 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg">
                        {filtered.length === 0 && !showCustom && (
                          <p className="px-4 py-3 text-sm text-gray-400">No matching courses found.</p>
                        )}
                        {filtered.map((course) => {
                          const name = course.name || course.courseName || course.title || '';
                          const selected = formData.selectedCourses.includes(name);
                          return (
                            <button
                              key={course.docId}
                              type="button"
                              onClick={() => { toggleCourse(name); setCourseSearch(''); setCourseDropdownOpen(false); }}
                              className={`w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                                selected ? 'bg-[#f0eaf5] text-[#4B1D63] font-medium' : 'text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              <span className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                                selected ? 'bg-[#4B1D63] border-[#4B1D63]' : 'border-gray-300'
                              }`}>
                                {selected && (
                                  <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </span>
                              {name}
                            </button>
                          );
                        })}
                        {/* Add custom course option */}
                        {showCustom && (
                          <button
                            type="button"
                            onClick={() => { toggleCourse(trimmed); setCourseSearch(''); setCourseDropdownOpen(false); }}
                            className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm text-[#4B1D63] hover:bg-[#f0eaf5] border-t border-gray-100 font-medium transition-colors"
                          >
                            <span className="w-4 h-4 rounded border-2 border-dashed border-[#4B1D63] flex items-center justify-center flex-shrink-0 text-[#4B1D63] text-xs font-bold">+</span>
                            Add &ldquo;{trimmed}&rdquo;
                          </button>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-2">
                <button type="button" onClick={closeModal}
                  className="px-5 py-2 bg-gray-200 hover:bg-gray-300 transition-colors text-gray-700 text-sm font-medium rounded-lg">
                  Cancel
                </button>
                <button type="submit"
                  className="px-5 py-2 bg-[#4B1D63] hover:bg-[#3A154D] transition-colors text-white text-sm font-medium rounded-lg">
                  {isEditingId ? 'Update Student' : 'Save Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentsDashboard;