import React, { useEffect, useState } from 'react';
import AddCourseForm from '../components/AddCourseForm';
import CourseCard from '../components/CourseCard';
import { API_BASE } from '../config';
import { logActivity } from '../utils/activityLogger';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export default function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [reportDropdownOpen, setReportDropdownOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('courses'); // 'courses' or 'timetable'

  const fetchCourses = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/courses`);
      const data = await response.json();
      setCourses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (!e.target.closest('#report-dropdown')) {
        setReportDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSave = async (formData) => {
    try {
      const isEditing = Boolean(editingCourse);
      const url = isEditing
        ? `${API_BASE}/api/courses/${editingCourse.docId}`
        : `${API_BASE}/api/courses`;
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        if (isEditing) {
          logActivity(`Course ${formData.name} was updated.`);
        } else {
          logActivity(`Course ${formData.name} was added.`);
        }

        setShowForm(false);
        setEditingCourse(null);
        fetchCourses();
      } else {
        console.error('Failed to save course');
      }
    } catch (error) {
      console.error('Error saving course:', error);
    }
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const tableColumn = ["ID", "Course Name", "Teacher", "Schedule"];
    const tableRows = [];
    filtered.forEach(course => {
      const schedule = course.date && (course.start || course.end)
        ? `${course.date} ${course.start}${course.end ? ` to ${course.end}` : ''}`
        : '';
      tableRows.push([
        course.id || '',
        course.name || '',
        course.teacher || '',
        schedule,
      ]);
    });
    autoTable(doc, { head: [tableColumn], body: tableRows, startY: 20 });
    doc.text(`Roots Institute - Courses Report`, 14, 15);
    doc.save(`courses_report.pdf`);
    setReportDropdownOpen(false);
  };

  const handleExportExcel = () => {
    const excelData = filtered.map(course => ({
      "ID": course.id || '',
      "Course Name": course.name || '',
      "Teacher": course.teacher || '',
      "Schedule": (course.date && (course.start || course.end))
        ? `${course.date} ${course.start}${course.end ? ` to ${course.end}` : ''}`
        : '',
    }));
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Courses");
    XLSX.writeFile(workbook, `courses_report.xlsx`);
    setReportDropdownOpen(false);
  };

  const handleDelete = async (docId, courseName = 'Course') => {
    if (!window.confirm('Delete this course?')) return;

    try {
      const response = await fetch(`${API_BASE}/api/courses/${docId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        logActivity(`Course ${courseName} was deleted.`);
        fetchCourses();
      } else {
        console.error('Failed to delete course');
      }
    } catch (error) {
      console.error('Error deleting course:', error);
    }
  };

  const filtered = courses.filter((c) =>
    (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.teacher || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.id || '').toLowerCase().includes(search.toLowerCase())
  );

  // Helper function to convert time string to minutes (0-1440)
  const timeToMinutes = (timeStr) => {
    if (!timeStr) return null;
    
    // More flexible regex that handles various time formats
    const match = timeStr.match(/(\d{1,2})[:.](\d{2})\s*(a\.?m\.?|p\.?m\.?)?/i);
    if (!match) return null;
    
    let hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    const period = match[3]?.toUpperCase().replace(/\./g, '');

    // Handle AM/PM
    if (period && (period === 'PM' || period === 'P' || period === 'PM') && hours !== 12) {
      hours += 12;
    }
    if (period && (period === 'AM' || period === 'A' || period === 'AM') && hours === 12) {
      hours = 0;
    }

    return hours * 60 + minutes;
  };

  // Helper function to convert minutes back to time string
  const minutesToTime = (mins) => {
    const hours = Math.floor(mins / 60);
    const mins_part = mins % 60;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${mins_part.toString().padStart(2, '0')} ${ampm}`;
  };

  // Organize courses for timetable view with proper time slot spanning
  const getTimetableData = () => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const unscheduledCourses = [];
    const daySchedules = {};
    let minTime = Infinity;
    let maxTime = -Infinity;

    days.forEach(day => {
      daySchedules[day] = [];
    });

    // Collect all scheduled courses and find time range
    filtered.forEach(course => {
      if (course.date && course.start && course.end) {
        const startMins = timeToMinutes(course.start);
        const endMins = timeToMinutes(course.end);

        console.log(`Processing course: ${course.name}, Date: ${course.date}, Start: ${course.start} (${startMins}), End: ${course.end} (${endMins})`);

        if (startMins !== null && endMins !== null) {
          // Normalize day name to match the days array (case-insensitive)
          const normalizedDay = days.find(day =>
            day.toLowerCase() === course.date?.toLowerCase()
          );

          console.log(`Normalized day: ${normalizedDay}`);

          if (normalizedDay) {
            daySchedules[normalizedDay].push({
              ...course,
              startMins,
              endMins,
              duration: endMins - startMins,
            });
            minTime = Math.min(minTime, startMins);
            maxTime = Math.max(maxTime, endMins);
            console.log(`Added to ${normalizedDay}: ${course.name}`);
          } else {
            unscheduledCourses.push(course);
            console.log(`Day not found for: ${course.date}`);
          }
        } else {
          unscheduledCourses.push(course);
          console.log(`Time parsing failed for ${course.name}: start=${startMins}, end=${endMins}`);
        }
      } else {
        unscheduledCourses.push(course);
        console.log(`Missing date/start/end for: ${course.name}`);
      }
    });

    console.log('Final daySchedules:', daySchedules);

    // Set fixed time range from 8:00 AM to 10:00 PM
    minTime = 8 * 60;   // 8:00 AM
    maxTime = 22 * 60;  // 10:00 PM

    // Round to nearest hour
    minTime = Math.floor(minTime / 60) * 60;
    maxTime = Math.ceil(maxTime / 60) * 60;

    // Generate hourly time slots
    const timeSlots = [];
    for (let time = minTime; time < maxTime; time += 60) {
      timeSlots.push(time);
    }

    return {
      days,
      daySchedules,
      unscheduledCourses,
      timeSlots,
      minTime,
      maxTime,
    };
  };

  const { days, daySchedules, unscheduledCourses, timeSlots } = getTimetableData();

  return (
    <main className="flex-1 flex flex-col bg-white overflow-hidden">
      <div className="bg-[#E6E6E6] px-10 py-3 border-b border-gray-300">
        <h2 className="text-xs font-bold text-gray-500 tracking-tight uppercase">
          COURSES
        </h2>
      </div>

      <div className="section-shell" style={{ paddingTop: '10px' }}>
        <div className="page-header">
          <div>
            <h1 className="page-heading" style={{ marginBottom: '0px' }}>Courses</h1>
            <p className="page-subheading" style={{ marginBottom: '25px' }}>Manage course offerings and schedules</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative" id="report-dropdown">
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
                  <button type="button" onClick={() => handleExportPDF()} className="block w-full text-left px-5 py-2 text-sm text-gray-700 hover:bg-[#d9cde4] flex justify-between items-center transition-colors">
                    Export to PDF <span className="text-red-500 font-bold text-xs bg-red-50 px-2 py-0.5 rounded">PDF</span>
                  </button>
                  <button type="button" onClick={() => handleExportExcel()} className="block w-full text-left px-5 py-2 text-sm text-gray-700 hover:bg-[#d9cde4] flex justify-between items-center transition-colors">
                    Export to Excel <span className="text-green-600 font-bold text-xs bg-green-50 px-2 py-0.5 rounded">XLS</span>
                  </button>
                </div>
              )}
            </div>

            <button
              className="bg-[#3B1155] hover:bg-[#2d0d42] text-white px-5 py-2.5 rounded-full font-medium shadow-sm flex items-center gap-2 text-sm transition-colors"
              onClick={() => {
                setEditingCourse(null);
                setShowForm(true);
              }}
            >
              <span className="text-lg">+</span> Add Course
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab('courses')}
            className={`px-6 py-3 font-medium text-sm transition-colors ${
              activeTab === 'courses'
                ? 'border-b-2 border-[#4B1D63] text-[#4B1D63]'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Course List
          </button>
          <button
            onClick={() => setActiveTab('timetable')}
            className={`px-6 py-3 font-medium text-sm transition-colors ${
              activeTab === 'timetable'
                ? 'border-b-2 border-[#4B1D63] text-[#4B1D63]'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Weekly Timetable
          </button>
        </div>

        {activeTab === 'courses' && (
          <>
            <div className="search-bar">
              <input
                className="search-input"
                placeholder="Search by course name, teacher or ID"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="courses-grid">
              {filtered.map((course) => (
                <CourseCard
                  key={course.docId}
                  course={course}
                  onEdit={(c) => {
                    setEditingCourse(c);
                    setShowForm(true);
                  }}
                  onDelete={() => handleDelete(course.docId, course.name)}
                />
              ))}

              {filtered.length === 0 && (
                <div className="empty-state">No courses found.</div>
              )}
            </div>
          </>
        )}

        {activeTab === 'timetable' && (
          <div className="timetable-container">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                <table className="min-w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b-2 border-gray-300">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-24 border-r border-gray-300">
                        Time
                      </th>
                      {days.map(day => (
                        <th key={day} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-r border-gray-300 last:border-r-0" style={{ width: '200px' }}>
                          {day}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {timeSlots.length > 0 ? (
                      timeSlots.map((timeSlot, slotIndex) => {
                        // For each row, determine which day columns should render a cell
                        const cellsToRender = {};
                        
                        days.forEach(day => {
                          // Find if there's a course active during this time slot
                          const daySchedule = daySchedules[day] || [];
                          const activeCourse = daySchedule.find(c => c.startMins <= timeSlot && c.endMins > timeSlot);
                          
                          if (!activeCourse) {
                            // No course, render empty cell
                            cellsToRender[day] = { type: 'empty', rowSpan: 1 };
                          } else if (activeCourse.startMins === timeSlot) {
                            // Course starts at this slot, render it with rowspan
                            const rowSpan = Math.ceil(activeCourse.duration / 60);
                            cellsToRender[day] = { type: 'course', course: activeCourse, rowSpan };
                          } else {
                            // Course is continuing from previous slot, don't render cell
                            cellsToRender[day] = { type: 'skip' };
                          }
                        });

                        return (
                          <tr key={timeSlot} className="hover:bg-gray-50 border-b border-gray-200" style={{ height: '100px' }}>
                            <td className="px-4 py-3 border-r border-gray-300 bg-gray-50 font-semibold text-sm text-gray-700 w-24 align-top" style={{ verticalAlign: 'top' }}>
                              <div className="text-xs font-medium">{minutesToTime(timeSlot)}</div>
                              <div className="text-xs text-gray-500 mt-1">to</div>
                              <div className="text-xs font-medium">{minutesToTime(timeSlot + 60)}</div>
                            </td>
                            {days.map(day => {
                              const cell = cellsToRender[day];
                              
                              // Skip rendering if this cell is covered by a rowspan from above
                              if (cell.type === 'skip') {
                                return <React.Fragment key={`${day}-${timeSlot}-skip`} />;
                              }

                              const cellHeight = cell.rowSpan * 100;
                              return (
                                <td key={`${day}-${timeSlot}`} className="px-2 py-2 border-r border-gray-300 last:border-r-0 align-top" rowSpan={cell.rowSpan} style={{ verticalAlign: 'top', height: `${cellHeight}px` }}>
                                  {cell.type === 'course' ? (
                                    <div className="bg-[#4B1D63] text-white p-3 rounded-lg shadow-md w-full h-full flex flex-col justify-between border border-[#3A1649]">
                                      <div>
                                        <div className="font-bold text-sm leading-tight">{cell.course.name}</div>
                                        <div className="text-xs opacity-95 mt-1">{cell.course.teacher}</div>
                                        <div className="text-xs opacity-75">{cell.course.level}</div>
                                        <div className="text-xs opacity-80 mt-1 font-medium">
                                          {cell.course.start} → {cell.course.end}
                                        </div>
                                      </div>
                                      <div className="flex gap-1 mt-2">
                                        <button
                                          onClick={() => {
                                            setEditingCourse(cell.course);
                                            setShowForm(true);
                                            setActiveTab('courses');
                                          }}
                                          className="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded text-white transition-colors flex-1"
                                        >
                                          Edit
                                        </button>
                                        <button
                                          onClick={() => handleDelete(cell.course.docId, cell.course.name)}
                                          className="text-xs bg-red-500/80 hover:bg-red-600 px-2 py-1 rounded text-white transition-colors flex-1"
                                        >
                                          Delete
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="w-full h-full bg-gray-50 rounded border border-dashed border-gray-300 flex items-center justify-center text-gray-300 text-sm"></div>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={days.length + 1} className="px-4 py-8 text-center text-gray-500">
                          No scheduled courses yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Unscheduled Courses Section */}
            {unscheduledCourses.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Unscheduled Courses</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {unscheduledCourses.map((course) => (
                    <div key={course.docId} className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="font-semibold text-gray-800">{activeCourse.name}</div>
                      <div className="text-sm text-gray-600">{activeCourse.teacher}</div>
                      <div className="text-sm text-gray-500">{activeCourse.level}</div>
                      <div className="text-sm text-gray-500">ID: {course.id}</div>
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => {
                            setEditingCourse(activeCourse);
                            setShowForm(true);
                            setActiveTab('courses');
                          }}
                          className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded transition-colors"
                        >
                          Add to Schedule
                        </button>
                        <button
                          onClick={() => handleDelete(activeCourse.docId, activeCourse.name)}
                          className="text-xs bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {showForm && (
        <div className="form-panel">
          <h2 className="form-panel-title">
            {editingCourse ? 'Edit Course' : 'Add New Course'}
          </h2>

          <AddCourseForm
            onAdd={handleSave}
            initialData={editingCourse}
          />

          <button
            className="btn-secondary"
            onClick={() => {
              setShowForm(false);
              setEditingCourse(null);
            }}
          >
            Cancel
          </button>
        </div>
      )}
    </main>
  );
}
// DEBUG: Let's see what's happening

