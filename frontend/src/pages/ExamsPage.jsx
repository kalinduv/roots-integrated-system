import React, { useEffect, useMemo, useState } from 'react';
import { Award, Pencil, Plus, Trash2, TrendingDown, TrendingUp, Download, History } from 'lucide-react';
import { API_BASE } from '../config';
import AddResultModalSimple from '../components/AddResultModalSimple';
import { logActivity } from '../utils/activityLogger';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export default function ExamsPage() {
  const [results, setResults] = useState([]);
  const [search, setSearch] = useState('');
  const [courseFilter, setCourseFilter] = useState('All Courses');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [reportDropdownOpen, setReportDropdownOpen] = useState(false);
  const [viewMode, setViewMode] = useState('current'); // 'current' or 'old'

  const load = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/results`);
      const data = await res.json();
      setResults(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading results:', error);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const visibleResults = results.filter((r) => {
    const createdAt = new Date(r.createdAt || 0);
    return viewMode === 'old' ? createdAt < thirtyDaysAgo : createdAt >= thirtyDaysAgo;
  });

  const filtered = useMemo(
    () =>
      visibleResults.filter(
        (r) => {
          const course = (r.course || '').trim();
          return (
            (courseFilter === 'All Courses' || course === courseFilter.trim()) &&
            [r.studentId, r.studentName, course].join(' ').toLowerCase().includes(search.toLowerCase())
          );
        }
      ),
    [visibleResults, courseFilter, search]
  );

  const stats = useMemo(
    () => ({
      average: filtered.length
        ? (filtered.reduce((a, r) => a + Number(r.total || 0), 0) / filtered.length).toFixed(1) + '%'
        : '0%',
      highest: filtered.length
        ? Math.max(...filtered.map((r) => Number(r.total || 0))).toFixed(1) + '%'
        : '0%',
      lowest: filtered.length
        ? Math.min(...filtered.map((r) => Number(r.total || 0))).toFixed(1) + '%'
        : '0%',
      aGrades: filtered.filter((r) => ['A', 'A+'].includes(r.grade)).length,
    }),
    [filtered]
  );

  const save = async (form) => {
    try {
      const method = editing ? 'PUT' : 'POST';
      const url = editing
        ? `${API_BASE}/api/results/${editing.id}`
        : `${API_BASE}/api/results`;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (response.ok) {
        const successMsg = editing
          ? "Sucessfully Update and send email to Student"
          : "Sucessfully Add result and send email to Student";

        // 1. Close modal and clear state first
        setOpen(false);
        setEditing(null);

        // 2. Alert and refresh after a tiny delay for better UX
        setTimeout(() => {
          window.alert(successMsg);
          console.log(successMsg);
          load();
        }, 300);

        if (editing) {
          logActivity(`Result for ${form.studentName} was updated.`);
        } else {
          logActivity(`Result for ${form.studentName} was added.`);
        }
      } else {
        console.error("Save failed:", response.status);
        window.alert("Failed to save. Error code: " + response.status);
      }
    } catch (error) {
      console.error('Error saving result:', error);
    }
  };

  const remove = async (id, studentName) => {
    const ok = window.confirm('Delete this result?');
    if (!ok) return;

    try {
      const response = await fetch(`${API_BASE}/api/results/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        logActivity(`Result for ${studentName} was deleted.`);
        load();
      }
    } catch (error) {
      console.error('Error deleting result:', error);
    }
  };

  const courses = ['All Courses', ...new Set(visibleResults.map((r) => (r.course || '').trim()).filter(Boolean))];

  const handleExportPDF = (type) => {
    const doc = new jsPDF();
    const tableColumn = ["Student ID", "Student Name", "Course", "MCQ", "Essay", "Total", "Grade"];
    const tableRows = [];

    const dataToExport = type === 'filtered' ? filtered : visibleResults;

    dataToExport.forEach(r => {
      const rowData = [
        r.studentId || '',
        r.studentName || '',
        r.course || '',
        `${r.mcqMarks}%`,
        `${r.essayMarks}%`,
        `${Number(r.total || 0).toFixed(2)}%`,
        r.grade || ''
      ];
      tableRows.push(rowData);
    });

    autoTable(doc, { head: [tableColumn], body: tableRows, startY: 20 });
    doc.text(`Roots Institute - Exam Results Report (${type === 'filtered' ? 'Filtered' : 'All'})`, 14, 15);
    doc.save(`exam_results_${type}_${new Date().toISOString().split('T')[0]}.pdf`);
    setReportDropdownOpen(false);
  };

  const handleExportExcel = (type) => {
    const dataToExport = type === 'filtered' ? filtered : visibleResults;

    const excelData = dataToExport.map(r => ({
      "Student ID": r.studentId || '',
      "Student Name": r.studentName || '',
      "Course": r.course || '',
      "MCQ Marks": `${r.mcqMarks}%`,
      "Essay Marks": `${r.essayMarks}%`,
      "Total Score": `${Number(r.total || 0).toFixed(2)}%`,
      "Grade": r.grade || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Exam Results");
    XLSX.writeFile(workbook, `exam_results_${type}_${new Date().toISOString().split('T')[0]}.xlsx`);
    setReportDropdownOpen(false);
  };

  return (
    <main className="flex-1 flex flex-col bg-white overflow-hidden">
      <div className="bg-[#E6E6E6] px-10 py-3 border-b border-gray-300">
        <h2 className="text-xs font-bold text-gray-500 tracking-tight uppercase">
          EXAMS & RESULTS
        </h2>
      </div>

      <div className="section-shell" style={{ paddingTop: '10px', height: 'calc(100vh - 40px)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-4">
          <div>
            <h1 className="page-heading" style={{ marginBottom: '0px' }}>Exams & Results</h1>
            <p className="page-subheading" style={{ marginBottom: '6px' }}>
              {viewMode === 'old'
                ? 'Archived results from 30+ days ago.'
                : 'Manage current student marks and grades (last 30 days).'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                type="button"
                onClick={() => setReportDropdownOpen(!reportDropdownOpen)}
                className="bg-[#9867C5] hover:bg-[#8451AF] text-white px-5 py-2.5 rounded-full shadow-sm text-sm font-medium flex items-center gap-2 transition-colors"
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
                <div className="absolute right-0 mt-3 w-64 bg-white border border-gray-100 rounded-2xl shadow-2xl py-3 z-50">
                  <div className="px-5 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    All Records
                  </div>
                  <button
                    onClick={() => handleExportPDF('all')}
                    className="w-full text-left px-6 py-3 text-sm text-gray-700 hover:bg-[#f3f4f6] flex justify-between items-center transition-colors"
                  >
                    Export to PDF <span className="text-red-500 font-bold text-xs bg-red-50 px-2 py-1 rounded">PDF</span>
                  </button>
                  <button
                    onClick={() => handleExportExcel('all')}
                    className="w-full text-left px-6 py-3 text-sm text-gray-700 hover:bg-[#f3f4f6] flex justify-between items-center transition-colors mb-2"
                  >
                    Export to Excel <span className="text-green-600 font-bold text-xs bg-green-50 px-2 py-1 rounded">XLS</span>
                  </button>

                  <div className="h-[1px] bg-gray-100 w-full mb-2" />

                  <div className="px-5 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Filtered Results
                  </div>
                  <button
                    onClick={() => handleExportPDF('filtered')}
                    className="w-full text-left px-6 py-3 text-sm text-gray-700 hover:bg-[#f3f4f6] flex justify-between items-center transition-colors"
                  >
                    Export to PDF <span className="text-red-500 font-bold text-xs bg-red-50 px-2 py-1 rounded">PDF</span>
                  </button>
                  <button
                    onClick={() => handleExportExcel('filtered')}
                    className="w-full text-left px-6 py-3 text-sm text-gray-700 hover:bg-[#f3f4f6] flex justify-between items-center transition-colors"
                  >
                    Export to Excel <span className="text-green-600 font-bold text-xs bg-green-50 px-2 py-1 rounded">XLS</span>
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => setViewMode(viewMode === 'current' ? 'old' : 'current')}
              className={`px-5 py-2.5 rounded-full shadow-sm text-sm font-medium flex items-center gap-2 transition-all ${viewMode === 'old'
                ? 'bg-[#9867C5] hover:bg-[#8451AF] text-white'
                : 'bg-[#9867C5] hover:bg-[#8451AF] text-white'
                }`}
            >
              <History size={16} className="text-white" />
              {viewMode === 'old' ? 'Back to Current' : 'Old Added Result'}
            </button>

            {viewMode !== 'old' && (
              <button
                onClick={() => {
                  setEditing(null);
                  setOpen(true);
                }}
                className="bg-[#3F1559] hover:bg-[#2e0f41] text-white px-5 py-2.5 rounded-full shadow-sm text-sm font-medium flex items-center gap-2 ml-2 transition-colors"
              >
                <Plus size={16} /> Add Results
              </button>
            )}
          </div>
        </div>




        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-3">
          {[
            { label: 'Average Score', value: stats.average, icon: <TrendingUp /> },
            { label: 'Highest Score', value: stats.highest, icon: <Award /> },
            { label: 'Lowest Score', value: stats.lowest, icon: <TrendingDown /> },
            { label: 'A Grades', value: stats.aGrades, icon: <span className="font-bold text-2xl">A</span> },
          ].map((s) => (
            <div key={s.label} className="bg-[#bda6c9] rounded-3xl p-6 flex justify-between items-center">
              <div>
                <p className="text-[#3F1559] font-bold mb-2 text-sm">{s.label}</p>
                <h3 className="text-3xl font-bold">{s.value}</h3>
              </div>
              <div className="bg-white p-4 rounded-2xl text-[#3F1559]">{s.icon}</div>
            </div>
          ))}
        </div>

        <div className="bg-[#D1D1D1] rounded-2xl p-4 mb-3 grid md:grid-cols-2 gap-6">
          <div>
            <label className="block mb-2 font-semibold">Course</label>
            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className="modal-input"
            >
              {courses.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-2 font-semibold">Search Student</label>
            <input
              className="modal-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by student name or ID"
            />
          </div>
        </div>

        <div className="table-shell" style={{ maxHeight: '400px', overflow: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Course</th>
                <th>MCQ</th>
                <th>Essay</th>
                <th>Total</th>
                <th>Grade</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((row) => (
                <tr key={row.id}>
                  <td>
                    <div className="font-medium">{row.studentName}</div>
                    <div className="text-gray-500 text-xs">{row.studentId}</div>
                  </td>
                  <td>{row.course}</td>
                  <td>{row.mcqMarks}%</td>
                  <td>{row.essayMarks}%</td>
                  <td>{Number(row.total || 0).toFixed(2)}%</td>
                  <td>{row.grade}</td>
                  <td>
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setEditing(row);
                          setOpen(true);
                        }}
                      >
                        <Pencil size={20} />
                      </button>

                      <button onClick={() => remove(row.id, row.studentName)}>
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center text-gray-500">
                    No results found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <AddResultModalSimple
        open={open}
        onClose={() => {
          setOpen(false);
          setEditing(null);
        }}
        onSave={save}
        initialData={editing}
      />
    </main>
  );
}