import React, { useEffect, useMemo, useState } from 'react';
import { API_BASE } from '../config';
import { logActivity } from '../utils/activityLogger';

export default function AttendancePage() {
  const [attendanceList, setAttendanceList] = useState([]);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // Format: YYYY-MM

  const [formData, setFormData] = useState({
    studentId: '',
    studentName: '',
    course: '',
    date: '',
    time: '',
    status: 'Present',
  });

  const getTodayDate = () => new Date().toISOString().split('T')[0];
  const getCurrentTime = () => new Date().toTimeString().slice(0, 5);

  const [reportDate, setReportDate] = useState(getTodayDate());

  useEffect(() => {
    fetchAttendance();
    fetchStudents();
    fetchCourses();
  }, []);

  const fetchAttendance = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/attendance`);
      const data = await response.json();
      setAttendanceList(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/students`);
      const data = await response.json();
      setStudents(Array.isArray(data) ? data : []);
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

  const normalizedCourseOptions = useMemo(() => {
    const names = courses
      .map((course) =>
        course.courseName ||
        course.name ||
        course.title ||
        course.course ||
        ''
      )
      .filter(Boolean);

    return [...new Set(names)];
  }, [courses]);

  const summaryCards = useMemo(() => {
    const total = attendanceList.length;
    const present = attendanceList.filter(
      (item) => (item.status || '').toLowerCase() === 'present'
    ).length;
    const absent = attendanceList.filter(
      (item) => (item.status || '').toLowerCase() === 'absent'
    ).length;

    return { total, present, absent };
  }, [attendanceList]);

  // Calculate monthly attendance for a specific student
  const monthlyStudentAttendance = useMemo(() => {
    if (!searchTerm.trim()) return null;

    const searchLower = searchTerm.trim().toLowerCase();
    const studentRecords = attendanceList.filter(
      (item) => (item.studentId || '').toLowerCase() === searchLower
    );

    if (studentRecords.length === 0) return null;

    // Get student info
    const student = studentRecords[0];
    const studentName = student.studentName || '';

    // Filter records by selected month
    const monthRecords = studentRecords.filter(
      (record) => (record.date || '').startsWith(selectedMonth)
    );

    if (monthRecords.length === 0) return null;

    // Keep all records with course info and sort by date
    const recordsWithCourse = monthRecords.map((record) => ({
      date: record.date,
      course: record.course || 'Unknown Course',
      status: record.status || 'Present',
      time: record.time || '',
      id: record.id,
    })).sort((a, b) => {
      if (a.date !== b.date) {
        return a.date.localeCompare(b.date);
      }
      // Sort by time if same date
      return (a.time || '').localeCompare(b.time || '');
    });

    // Group records by date for display purposes
    const groupedByDate = {};
    recordsWithCourse.forEach((record) => {
      if (!groupedByDate[record.date]) {
        groupedByDate[record.date] = [];
      }
      groupedByDate[record.date].push(record);
    });

    const sortedDates = Object.keys(groupedByDate).sort();

    // Calculate statistics based on individual attendance records
    const totalRecords = recordsWithCourse.length;
    const presentCount = recordsWithCourse.filter(
      (record) => record.status.toLowerCase() === 'present'
    ).length;
    const absentCount = recordsWithCourse.filter(
      (record) => record.status.toLowerCase() === 'absent'
    ).length;

    const attendancePercentage = totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 0;

    return {
      studentId: searchLower,
      studentName,
      recordsWithCourse,
      groupedByDate,
      sortedDates,
      totalRecords,
      presentCount,
      absentCount,
      attendancePercentage,
    };
  }, [attendanceList, searchTerm, selectedMonth]);

  const filteredAttendance = useMemo(() => {
    return attendanceList.filter((item) => {
      const q = searchTerm.toLowerCase();
      return (
        (item.studentId || '').toLowerCase().includes(q) ||
        (item.studentName || '').toLowerCase().includes(q) ||
        (item.course || '').toLowerCase().includes(q) ||
        (item.status || '').toLowerCase().includes(q) ||
        (item.date || '').toLowerCase().includes(q) ||
        (item.time || '').toLowerCase().includes(q)
      );
    });
  }, [attendanceList, searchTerm]);

  const resetForm = () => {
    setFormData({
      studentId: '',
      studentName: '',
      course: '',
      date: getTodayDate(),
      time: getCurrentTime(),
      status: 'Present',
    });
    setEditingId(null);
  };

  const openAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const closeModal = () => {
    resetForm();
    setIsModalOpen(false);
  };

  const handleStudentIdChange = (e) => {
    const value = e.target.value;
    const matchedStudent = students.find(
      (student) => String(student.id).toLowerCase() === value.trim().toLowerCase()
    );

    setFormData((prev) => ({
      ...prev,
      studentId: value,
      studentName: matchedStudent ? matchedStudent.name || '' : '',
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'studentId') {
      handleStudentIdChange(e);
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEdit = (record) => {
    setEditingId(record.id);
    setFormData({
      studentId: record.studentId || '',
      studentName: record.studentName || '',
      course: record.course || '',
      date: record.date || getTodayDate(),
      time: record.time || getCurrentTime(),
      status: record.status || 'Present',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id, studentName) => {
    const ok = window.confirm('Are you sure you want to delete this attendance record?');
    if (!ok) return;

    try {
      const response = await fetch(`${API_BASE}/api/attendance/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        logActivity(`Attendance record for ${studentName} was deleted.`);
        fetchAttendance();
      }
    } catch (error) {
      console.error('Error deleting attendance:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      studentId: formData.studentId,
      studentName: formData.studentName,
      course: formData.course,
      date: formData.date,
      time: formData.time,
      status: formData.status,
    };

    try {
      const url = editingId
        ? `${API_BASE}/api/attendance/${editingId}`
        : `${API_BASE}/api/attendance`;

      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        if (editingId) {
          logActivity(`Attendance for ${formData.studentName} was updated.`);
        } else {
          logActivity(`Attendance for ${formData.studentName} was added.`);
        }

        await fetchAttendance();
        closeModal();
      }
    } catch (error) {
      console.error('Error saving attendance:', error);
    }
  };

  const downloadDailyReport = () => {
    const dailyRecords = attendanceList.filter(
      (item) => item.date === reportDate
    );

    if (dailyRecords.length === 0) {
      window.alert('No attendance records found for the selected date.');
      return;
    }

    const csvHeader = ['Student ID', 'Student Name', 'Course', 'Date', 'Time', 'Status'];
    const csvRows = dailyRecords.map((item) => [
      item.studentId || '',
      item.studentName || '',
      item.course || '',
      item.date || '',
      item.time || '',
      item.status || '',
    ]);

    const csvContent = [csvHeader, ...csvRows]
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `attendance-report-${reportDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 flex flex-col bg-secondary overflow-hidden">
      <div className="bg-[#E6E6E6] px-10 py-3 border-b border-gray-300">
        <h2 className="text-xs font-bold text-gray-500 tracking-widest uppercase">
          ATTENDANCE
        </h2>
      </div>

      <div className="bg-secondary px-10 pt-8 pb-6 flex flex-col gap-4 md:flex-row md:justify-between md:items-end">
        <div>
          <h1 className="text-4xl font-bold mb-2 text-gray-900">Attendance Management</h1>
          <p className="text-gray-600 text-sm">Track daily attendance and update status.</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3 bg-white rounded-full px-4 py-2 shadow-sm border border-gray-200">
            <label className="text-sm font-medium text-gray-700">Report date</label>
            <input
              type="date"
              value={reportDate}
              onChange={(e) => setReportDate(e.target.value)}
              className="h-12 rounded-full border border-gray-300 px-4 focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={downloadDailyReport}
            className="bg-[#4B1D63] hover:bg-[#3f174f] text-white px-6 py-3 rounded-full font-medium transition-colors shadow-sm"
          >
            Generate Daily Report
          </button>

          <button
            type="button"
            onClick={openAddModal}
            className="bg-accent hover:bg-primary text-white px-6 py-3 rounded-full font-medium transition-colors shadow-sm"
          >
            + Mark Attendance
          </button>
        </div>
      </div>

      <div className="px-10 flex-1 overflow-auto">
        <div className="mb-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search by Student ID..."
                className="w-full pl-12 pr-4 py-3 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <svg
                className="w-6 h-6 text-gray-400 absolute left-4 top-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            
            {monthlyStudentAttendance && (
              <div className="flex items-center gap-3 bg-white rounded-full px-4 py-2 shadow-sm border border-gray-200">
                <label className="text-sm font-medium text-gray-700">Month</label>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="h-10 rounded-full border border-gray-300 px-3 focus:outline-none"
                />
              </div>
            )}
          </div>
        </div>

        {/* Monthly Student Attendance View */}
        {monthlyStudentAttendance && (
          <div className="space-y-6">
            {/* Student Header */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-300 p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{monthlyStudentAttendance.studentName}</h3>
                  <p className="text-gray-600 text-sm mt-1">Student ID: {monthlyStudentAttendance.studentId.toUpperCase()}</p>
                </div>
                <div className="text-sm text-gray-600">
                  Month: <span className="font-semibold text-gray-900">{new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                </div>
              </div>
            </div>

            {/* Daily Attendance Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-300 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-stone-300 text-gray-800 text-left text-sm font-semibold border-b border-gray-400">
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Course</th>
                    <th className="px-6 py-4">Time</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-300">
                  {monthlyStudentAttendance.recordsWithCourse.map((record, index) => {
                    const dateObj = new Date(record.date + 'T00:00:00');
                    const formattedDate = dateObj.toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
                    
                    return (
                      <tr key={index} className="text-sm hover:bg-gray-50">
                        <td className="px-6 py-4 text-gray-700 font-medium">{formattedDate}</td>
                        <td className="px-6 py-4 text-gray-700">{record.course}</td>
                        <td className="px-6 py-4 text-gray-600">{record.time || '-'}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-block px-4 py-1 rounded-full text-white text-xs font-medium ${
                              record.status.toLowerCase() === 'present'
                                ? 'bg-green-500'
                                : record.status.toLowerCase() === 'absent'
                                ? 'bg-red-500'
                                : 'bg-yellow-500'
                            }`}
                          >
                            {record.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Statistics Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow-sm border border-gray-300 p-4">
                <div className="text-gray-600 text-sm font-medium">Total Classes</div>
                <div className="text-3xl font-bold text-gray-900 mt-1">{monthlyStudentAttendance.totalRecords}</div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-300 p-4">
                <div className="text-gray-600 text-sm font-medium">Present</div>
                <div className="text-3xl font-bold text-green-600 mt-1">{monthlyStudentAttendance.presentCount}</div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-300 p-4">
                <div className="text-gray-600 text-sm font-medium">Absent</div>
                <div className="text-3xl font-bold text-red-600 mt-1">{monthlyStudentAttendance.absentCount}</div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-300 p-4">
                <div className="text-gray-600 text-sm font-medium">Attendance %</div>
                <div className="text-3xl font-bold text-blue-600 mt-1">{monthlyStudentAttendance.attendancePercentage}%</div>
              </div>
            </div>
          </div>
        )}

        {/* Default All Records View - Only show when no student search or invalid student */}
        {!monthlyStudentAttendance && (
          <div className="bg-white rounded-t-lg overflow-hidden border border-gray-300 shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="bg-stone-300 text-gray-800 text-left text-sm font-semibold border-b border-gray-400">
                <th className="px-6 py-4">Student ID</th>
                <th className="px-6 py-4">Student Name</th>
                <th className="px-6 py-4">Course</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Time</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-300">
              {filteredAttendance.map((item) => (
                <tr key={item.id} className="text-sm">
                  <td className="px-6 py-4 text-gray-700">{item.studentId}</td>
                  <td className="px-6 py-4 text-gray-700">{item.studentName}</td>
                  <td className="px-6 py-4 text-gray-700">{item.course}</td>
                  <td className="px-6 py-4 text-gray-700">{item.date}</td>
                  <td className="px-6 py-4 text-gray-700">{item.time || '-'}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block px-4 py-1 rounded-full text-white text-xs font-medium ${
                        (item.status || '').toLowerCase() === 'present'
                          ? 'bg-green-500'
                          : 'bg-red-500'
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    <button onClick={() => handleEdit(item)} className="mr-3 hover:text-gray-700">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>

                    <button onClick={() => handleDelete(item.id, item.studentName)} className="hover:text-red-500">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredAttendance.length === 0 && (
            <div className="text-center py-10 text-gray-500">No attendance records found</div>
          )}
        </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-[#4B1D63]/35 backdrop-blur-[1px] flex items-center justify-center z-50">
          <div className="bg-[#f5f3f2] rounded-[28px] p-8 w-full max-w-4xl shadow-xl relative">
            <button
              onClick={closeModal}
              className="absolute top-6 right-8 text-4xl text-black leading-none"
              type="button"
            >
              ×
            </button>

            <h2 className="text-3xl md:text-4xl font-bold text-black mb-10">
              {editingId ? 'Edit Attendance' : 'Add Attendance'}
            </h2>

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div>
                  <label className="block text-[15px] font-semibold text-gray-900 mb-3">
                    Student ID
                  </label>
                  <input
                    required
                    type="text"
                    name="studentId"
                    value={formData.studentId}
                    onChange={handleChange}
                    className="w-full h-14 px-5 rounded-full border border-gray-300 bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[15px] font-semibold text-gray-900 mb-3">
                    Student Name
                  </label>
                  <input
                    required
                    type="text"
                    name="studentName"
                    value={formData.studentName}
                    onChange={handleChange}
                    className="w-full h-14 px-5 rounded-full border border-gray-300 bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[15px] font-semibold text-gray-900 mb-3">
                    Course
                  </label>
                  <select
                    required
                    name="course"
                    value={formData.course}
                    onChange={handleChange}
                    className="w-full h-14 px-5 rounded-full border border-gray-300 bg-white focus:outline-none"
                  >
                    <option value="">Select Course</option>
                    {normalizedCourseOptions.map((courseName, index) => (
                      <option key={index} value={courseName}>
                        {courseName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[15px] font-semibold text-gray-900 mb-3">
                    Date
                  </label>
                  <input
                    required
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    className="w-full h-14 px-5 rounded-full border border-gray-300 bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[15px] font-semibold text-gray-900 mb-3">
                    Time
                  </label>
                  <input
                    required
                    type="time"
                    name="time"
                    value={formData.time}
                    onChange={handleChange}
                    className="w-full h-14 px-5 rounded-full border border-gray-300 bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[15px] font-semibold text-gray-900 mb-3">
                    Status
                  </label>
                  <select
                    required
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full h-14 px-5 rounded-full border border-gray-300 bg-white focus:outline-none"
                  >
                    <option value="Present">Present</option>
                    <option value="Absent">Absent</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-10">
                <button
                  type="button"
                  onClick={closeModal}
                  className="h-14 rounded-full border border-gray-700 bg-white text-black text-xl"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="h-14 rounded-full bg-[#4B1D63] text-white text-xl"
                >
                  {editingId ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}