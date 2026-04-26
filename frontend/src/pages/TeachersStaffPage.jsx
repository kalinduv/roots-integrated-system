import React, { useEffect, useMemo, useState } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { API_BASE } from '../config';
import { logActivity } from '../utils/activityLogger';

export default function TeachersStaffPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);

  const [editingStaffId, setEditingStaffId] = useState(null);
  const [editingTeacherId, setEditingTeacherId] = useState(null);

  const [staffForm, setStaffForm] = useState({
    staffId: '',
    fullName: '',
    phone: '',
    email: '',
    date: '',
  });

  const [teacherForm, setTeacherForm] = useState({
    teacherId: '',
    name: '',
    courses: '',
    phone: '',
    email: '',
    date: '',
  });

  const [staffList, setStaffList] = useState([]);
  const [teacherList, setTeacherList] = useState([]);
  const [staffReportDropdownOpen, setStaffReportDropdownOpen] = useState(false);
  const [teacherReportDropdownOpen, setTeacherReportDropdownOpen] = useState(false);
  const [staffPhoneError, setStaffPhoneError] = useState('');
  const [teacherPhoneError, setTeacherPhoneError] = useState('');

  useEffect(() => {
    fetchStaff();
    fetchTeachers();
  }, []);

  const fetchStaff = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/staff`);
      const data = await response.json();
      setStaffList(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching staff:', error);
    }
  };

  const fetchTeachers = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/teachers`);
      const data = await response.json();
      setTeacherList(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching teachers:', error);
    }
  };

  const handleExportStaffPDF = (listType) => {
    const doc = new jsPDF();
    const tableColumn = ['Staff ID', 'Name', 'Email', 'Phone', 'Date', 'Status'];
    const dataToExport = listType === 'active' ? staffList.filter((item) => item.status !== false) : staffList;
    const tableRows = dataToExport.map((item) => [
      item.id || '',
      item.name || '',
      item.email || '',
      item.phone || '',
      item.date || '',
      item.status !== false ? 'Active' : 'Inactive',
    ]);
    autoTable(doc, { head: [tableColumn], body: tableRows, startY: 20 });
    doc.text(`Staff Report - ${listType === 'active' ? 'Active Staff' : 'All Staff'}`, 14, 15);
    doc.save(`staff_report_${listType}_${new Date().toISOString().split('T')[0]}.pdf`);
    setStaffReportDropdownOpen(false);
  };

  const handleExportStaffExcel = (listType) => {
    const dataToExport = listType === 'active' ? staffList.filter((item) => item.status !== false) : staffList;
    const excelData = dataToExport.map((item) => ({
      'Staff ID': item.id || '',
      Name: item.name || '',
      Email: item.email || '',
      Phone: item.phone || '',
      Date: item.date || '',
      Status: item.status !== false ? 'Active' : 'Inactive',
    }));
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Staff');
    XLSX.writeFile(workbook, `staff_report_${listType}_${new Date().toISOString().split('T')[0]}.xlsx`);
    setStaffReportDropdownOpen(false);
  };

  const handleExportTeacherPDF = (listType) => {
    const doc = new jsPDF();
    const tableColumn = ['Teacher ID', 'Name', 'Courses', 'Email', 'Phone', 'Date', 'Status'];
    const dataToExport = listType === 'active' ? teacherList.filter((item) => item.status !== false) : teacherList;
    const tableRows = dataToExport.map((item) => [
      item.id || '',
      item.name || '',
      item.courses || '',
      item.email || '',
      item.phone || '',
      item.date || '',
      item.status !== false ? 'Active' : 'Inactive',
    ]);
    autoTable(doc, { head: [tableColumn], body: tableRows, startY: 20 });
    doc.text(`Teacher Report - ${listType === 'active' ? 'Active Teachers' : 'All Teachers'}`, 14, 15);
    doc.save(`teacher_report_${listType}_${new Date().toISOString().split('T')[0]}.pdf`);
    setTeacherReportDropdownOpen(false);
  };

  const handleExportTeacherExcel = (listType) => {
    const dataToExport = listType === 'active' ? teacherList.filter((item) => item.status !== false) : teacherList;
    const excelData = dataToExport.map((item) => ({
      'Teacher ID': item.id || '',
      Name: item.name || '',
      Courses: item.courses || '',
      Email: item.email || '',
      Phone: item.phone || '',
      Date: item.date || '',
      Status: item.status !== false ? 'Active' : 'Inactive',
    }));
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Teachers');
    XLSX.writeFile(workbook, `teacher_report_${listType}_${new Date().toISOString().split('T')[0]}.xlsx`);
    setTeacherReportDropdownOpen(false);
  };

  const filteredStaffList = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return staffList.filter((item) =>
      (item.name || '').toLowerCase().includes(q) ||
      (item.id || '').toLowerCase().includes(q) ||
      (item.phone || '').toLowerCase().includes(q) ||
      (item.email || '').toLowerCase().includes(q)
    );
  }, [staffList, searchTerm]);

  const filteredTeacherList = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return teacherList.filter((item) =>
      (item.name || '').toLowerCase().includes(q) ||
      (item.id || '').toLowerCase().includes(q) ||
      (item.courses || '').toLowerCase().includes(q) ||
      (item.phone || '').toLowerCase().includes(q) ||
      (item.email || '').toLowerCase().includes(q)
    );
  }, [teacherList, searchTerm]);

  const toggleStaffStatus = async (docId, currentStatus) => {
    const existing = staffList.find((item) => item.docId === docId);
    if (!existing) return;

    try {
      const response = await fetch(`${API_BASE}/api/staff/${docId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: existing.id,
          name: existing.name,
          phone: existing.phone,
          email: existing.email,
          date: existing.date,
          status: !currentStatus,
        }),
      });

      if (response.ok) {
        logActivity(`Staff ${existing.name} status was changed to ${!currentStatus ? 'active' : 'inactive'}.`);
        fetchStaff();
      } else {
        const errorText = await response.text();
        console.error('Staff status update failed:', errorText);
      }
    } catch (error) {
      console.error('Error updating staff status:', error);
    }
  };

  const toggleTeacherStatus = async (docId, currentStatus) => {
    const existing = teacherList.find((item) => item.docId === docId);
    if (!existing) return;

    try {
      const response = await fetch(`${API_BASE}/api/teachers/${docId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: existing.id,
          name: existing.name,
          courses: existing.courses,
          phone: existing.phone,
          email: existing.email,
          date: existing.date,
          status: !currentStatus,
        }),
      });

      if (response.ok) {
        logActivity(`Teacher ${existing.name} status was changed to ${!currentStatus ? 'active' : 'inactive'}.`);
        fetchTeachers();
      } else {
        const errorText = await response.text();
        console.error('Teacher status update failed:', errorText);
      }
    } catch (error) {
      console.error('Error updating teacher status:', error);
    }
  };

  const openAddStaffModal = () => {
    // Auto-generate next Staff ID (ST100, ST101, ST102, etc.)
    let maxNum = 99;
    staffList.forEach(staff => {
      const match = staff.id?.match(/ST(\d+)/);
      if (match) {
        const num = parseInt(match[1]);
        if (num > maxNum) maxNum = num;
      }
    });
    const nextStaffId = `ST${maxNum + 1}`;

    setEditingStaffId(null);
    setStaffForm({
      staffId: nextStaffId,
      fullName: '',
      phone: '',
      email: '',
      date: '',
    });
    setIsStaffModalOpen(true);
  };

  const openAddTeacherModal = () => {
    // Auto-generate next Teacher ID (T100, T101, T102, etc.)
    let maxNum = 99;
    teacherList.forEach(teacher => {
      const match = teacher.id?.match(/T(\d+)/);
      if (match) {
        const num = parseInt(match[1]);
        if (num > maxNum) maxNum = num;
      }
    });
    const nextTeacherId = `T${maxNum + 1}`;

    setEditingTeacherId(null);
    setTeacherForm({
      teacherId: nextTeacherId,
      name: '',
      courses: '',
      phone: '',
      email: '',
      date: '',
    });
    setIsTeacherModalOpen(true);
  };

  const handleEditStaff = (item) => {
    setEditingStaffId(item.docId);
    setStaffForm({
      staffId: item.id || '',
      fullName: item.name || '',
      phone: item.phone || '',
      email: item.email || '',
      date: item.date || '',
    });
    setIsStaffModalOpen(true);
  };

  const handleEditTeacher = (item) => {
    setEditingTeacherId(item.docId);
    setTeacherForm({
      teacherId: item.id || '',
      name: item.name || '',
      courses: item.courses || '',
      phone: item.phone || '',
      email: item.email || '',
      date: item.date || '',
    });
    setIsTeacherModalOpen(true);
  };

  const handleDeleteStaff = async (docId) => {
    const staff = staffList.find((item) => item.docId === docId);
    const ok = window.confirm('Are you sure you want to delete this staff record?');
    if (!ok) return;

    try {
      const response = await fetch(`${API_BASE}/api/staff/${docId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        if (staff) {
          logActivity(`Staff ${staff.name} was deleted.`);
        }
        fetchStaff();
      } else {
        const errorText = await response.text();
        console.error('Delete staff failed:', errorText);
        alert('Failed to delete staff record.');
      }
    } catch (error) {
      console.error('Error deleting staff:', error);
      alert('Error deleting staff record.');
    }
  };

  const handleDeleteTeacher = async (docId) => {
    const teacher = teacherList.find((item) => item.docId === docId);
    const ok = window.confirm('Are you sure you want to delete this teacher record?');
    if (!ok) return;

    try {
      const response = await fetch(`${API_BASE}/api/teachers/${docId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        if (teacher) {
          logActivity(`Teacher ${teacher.name} was deleted.`);
        }
        fetchTeachers();
      } else {
        const errorText = await response.text();
        console.error('Delete teacher failed:', errorText);
        alert('Failed to delete teacher record.');
      }
    } catch (error) {
      console.error('Error deleting teacher:', error);
      alert('Error deleting teacher record.');
    }
  };

  const handleStaffFormChange = (e) => {
    const { name, value } = e.target;
    setStaffForm((prev) => ({ ...prev, [name]: value }));
    if (name === 'phone') {
      setStaffPhoneError('');
    }
  };

  const handleTeacherFormChange = (e) => {
    const { name, value } = e.target;
    setTeacherForm((prev) => ({ ...prev, [name]: value }));
    if (name === 'phone') {
      setTeacherPhoneError('');
    }
  };

  const closeStaffModal = () => {
    setIsStaffModalOpen(false);
    setEditingStaffId(null);
    setStaffPhoneError('');
    setStaffForm({
      staffId: '',
      fullName: '',
      phone: '',
      email: '',
      date: '',
    });
  };

  const closeTeacherModal = () => {
    setIsTeacherModalOpen(false);
    setEditingTeacherId(null);
    setTeacherPhoneError('');
    setTeacherForm({
      teacherId: '',
      name: '',
      courses: '',
      phone: '',
      email: '',
      date: '',
    });
  };

  const handleStaffSubmit = async (e) => {
    e.preventDefault();

    // Validate phone number - must have exactly 10 digits
    const phoneDigits = staffForm.phone.replace(/\D/g, '');
    if (phoneDigits.length !== 10) {
      setStaffPhoneError('Phone number must contain exactly 10 digits.');
      return;
    }

    const payload = {
      id: staffForm.staffId,
      name: staffForm.fullName,
      phone: staffForm.phone,
      email: staffForm.email,
      date: staffForm.date,
      status: editingStaffId
        ? staffList.find((item) => item.docId === editingStaffId)?.status ?? true
        : true,
    };

    try {
      const url = editingStaffId
        ? `${API_BASE}/api/staff/${editingStaffId}`
        : `${API_BASE}/api/staff`;

      const method = editingStaffId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        logActivity(`Staff ${staffForm.fullName} was ${editingStaffId ? 'updated' : 'added'}.`);
        await fetchStaff();
        closeStaffModal();
      } else {
        const errorText = await response.text();
        console.error('Staff save failed:', errorText);
        alert(`Failed to save staff record: ${errorText}`);
      }
    } catch (error) {
      console.error('Error saving staff:', error);
      alert('Error saving staff record.');
    }
  };

  const handleTeacherSubmit = async (e) => {
    e.preventDefault();

    // Validate phone number - must have exactly 10 digits
    const phoneDigits = teacherForm.phone.replace(/\D/g, '');
    if (phoneDigits.length !== 10) {
      setTeacherPhoneError('Phone number must contain exactly 10 digits.');
      return;
    }

    const payload = {
      id: teacherForm.teacherId,
      name: teacherForm.name,
      courses: teacherForm.courses,
      phone: teacherForm.phone,
      email: teacherForm.email,
      date: teacherForm.date,
      status: editingTeacherId
        ? teacherList.find((item) => item.docId === editingTeacherId)?.status ?? true
        : true,
    };

    try {
      const url = editingTeacherId
        ? `${API_BASE}/api/teachers/${editingTeacherId}`
        : `${API_BASE}/api/teachers`;

      const method = editingTeacherId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        logActivity(`Teacher ${teacherForm.name} was ${editingTeacherId ? 'updated' : 'added'}.`);
        await fetchTeachers();
        closeTeacherModal();
      } else {
        const errorText = await response.text();
        console.error('Teacher save failed:', errorText);
        alert(`Failed to save teacher record: ${errorText}`);
      }
    } catch (error) {
      console.error('Error saving teacher:', error);
      alert('Error saving teacher record.');
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden">
      <div className="bg-[#E6E6E6] px-10 py-3 border-b border-gray-300">
        <h2 className="text-xs font-bold text-gray-500 tracking-widest uppercase">
          TEACHERS & STAFF
        </h2>
      </div>

      <div className="px-10 pt-8 pb-4 bg-white">
        <h1 className="text-4xl font-bold mb-2 text-gray-900">
          Teachers & Staff
        </h1>
        <p className="text-gray-600 text-sm">
          Manage Teacher,Staff records and information
        </p>
      </div>

      <div className="px-10 pb-6 bg-white">
        <div className="relative">
          <input
            type="text"
            placeholder="Search teacher or staff..."
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
      </div>

      <div className="px-10 flex-1 overflow-auto pb-8 bg-white">
        <div className="pb-10">
          <div className="bg-white pb-6 flex flex-col lg:flex-row lg:justify-between gap-4 lg:items-center">
            <button className="w-[140px] h-[68px] rounded-xl text-white text-2xl shadow bg-[#4B1D63]">
              Staff
            </button>
            <div className="flex items-center gap-3">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setStaffReportDropdownOpen(!staffReportDropdownOpen)}
                  className="bg-[#B19CD9] hover:bg-[#A38ACF] text-white px-4 py-2.5 rounded-full font-medium shadow-sm text-sm flex items-center gap-2 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 2v6h6" />
                  </svg>
                  Generate Report
                  <svg className={`w-4 h-4 transition-transform ${staffReportDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {staffReportDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-100 rounded-lg shadow-lg py-2 z-10">
                    <div className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Staff List</div>
                    <button type="button" onClick={() => handleExportStaffPDF('all')} className="block w-full text-left px-5 py-2 text-sm text-gray-700 hover:bg-[#d9cde4] flex justify-between items-center transition-colors">
                      Export to PDF <span className="text-red-500 font-bold text-xs bg-red-50 px-2 py-0.5 rounded">PDF</span>
                    </button>
                    <button type="button" onClick={() => handleExportStaffExcel('all')} className="block w-full text-left px-5 py-2 text-sm text-gray-700 hover:bg-[#d9cde4] flex justify-between items-center transition-colors">
                      Export to Excel <span className="text-green-600 font-bold text-xs bg-green-50 px-2 py-0.5 rounded">XLS</span>
                    </button>
                    <div className="h-[1px] bg-gray-100 w-full my-1.5" />
                    <div className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Active Staff</div>
                    <button type="button" onClick={() => handleExportStaffPDF('active')} className="block w-full text-left px-5 py-2 text-sm text-gray-700 hover:bg-[#d9cde4] flex justify-between items-center transition-colors">
                      Export to PDF <span className="text-red-500 font-bold text-xs bg-red-50 px-2 py-0.5 rounded">PDF</span>
                    </button>
                    <button type="button" onClick={() => handleExportStaffExcel('active')} className="block w-full text-left px-5 py-2 text-sm text-gray-700 hover:bg-[#d9cde4] flex justify-between items-center transition-colors">
                      Export to Excel <span className="text-green-600 font-bold text-xs bg-green-50 px-2 py-0.5 rounded">XLS</span>
                    </button>
                  </div>
                )}
              </div>
              <button
                onClick={openAddStaffModal}
                className="bg-[#4B1D63] hover:bg-[#3d174f] text-white px-6 py-3 rounded-full font-medium transition-colors shadow-sm"
              >
                + Add Staff
              </button>
            </div>
          </div>

          <div className="bg-white rounded-t-lg overflow-hidden border border-gray-300 shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="bg-stone-300 text-gray-800 text-left text-sm font-semibold border-b border-gray-400">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Contact Number</th>
                  <th className="px-4 py-3">E-mail</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-300">
                {filteredStaffList.map((item) => (
                  <tr key={item.docId} className="text-sm">
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium text-gray-900 text-lg">{item.name}</div>
                        <div className="text-gray-500 text-sm mt-1">{item.id}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700 text-base">{item.phone}</td>
                    <td className="px-4 py-3 text-gray-700 text-base break-words">{item.email}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleStaffStatus(item.docId, item.status)}
                        className={`relative inline-block w-12 h-6 rounded-full cursor-pointer transition-colors ${
                          item.status ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${
                            item.status ? 'transform translate-x-6' : ''
                          }`}
                        />
                      </button>
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      <button onClick={() => handleEditStaff(item)} className="mr-3 hover:text-gray-700" title="Edit">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button onClick={() => handleDeleteStaff(item.docId)} className="hover:text-red-500" title="Delete">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredStaffList.length === 0 && (
              <div className="text-center py-10 text-gray-500">No staff found</div>
            )}
          </div>
        </div>

        <div>
          <div className="bg-white pb-6 flex flex-col lg:flex-row lg:justify-between gap-4 lg:items-center">
            <button className="w-[140px] h-[68px] rounded-xl text-white text-2xl shadow bg-[#4B1D63]">
              Teachers
            </button>
            <div className="flex items-center gap-3">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setTeacherReportDropdownOpen(!teacherReportDropdownOpen)}
                  className="bg-[#B19CD9] hover:bg-[#A38ACF] text-white px-4 py-2.5 rounded-full font-medium shadow-sm text-sm flex items-center gap-2 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 2v6h6" />
                  </svg>
                  Generate Report
                  <svg className={`w-4 h-4 transition-transform ${teacherReportDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {teacherReportDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-100 rounded-lg shadow-lg py-2 z-10">
                    <div className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Teacher List</div>
                    <button type="button" onClick={() => handleExportTeacherPDF('all')} className="block w-full text-left px-5 py-2 text-sm text-gray-700 hover:bg-[#d9cde4] flex justify-between items-center transition-colors">
                      Export to PDF <span className="text-red-500 font-bold text-xs bg-red-50 px-2 py-0.5 rounded">PDF</span>
                    </button>
                    <button type="button" onClick={() => handleExportTeacherExcel('all')} className="block w-full text-left px-5 py-2 text-sm text-gray-700 hover:bg-[#d9cde4] flex justify-between items-center transition-colors">
                      Export to Excel <span className="text-green-600 font-bold text-xs bg-green-50 px-2 py-0.5 rounded">XLS</span>
                    </button>
                    <div className="h-[1px] bg-gray-100 w-full my-1.5" />
                    <div className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Active Teachers</div>
                    <button type="button" onClick={() => handleExportTeacherPDF('active')} className="block w-full text-left px-5 py-2 text-sm text-gray-700 hover:bg-[#d9cde4] flex justify-between items-center transition-colors">
                      Export to PDF <span className="text-red-500 font-bold text-xs bg-red-50 px-2 py-0.5 rounded">PDF</span>
                    </button>
                    <button type="button" onClick={() => handleExportTeacherExcel('active')} className="block w-full text-left px-5 py-2 text-sm text-gray-700 hover:bg-[#d9cde4] flex justify-between items-center transition-colors">
                      Export to Excel <span className="text-green-600 font-bold text-xs bg-green-50 px-2 py-0.5 rounded">XLS</span>
                    </button>
                  </div>
                )}
              </div>
              <button
                onClick={openAddTeacherModal}
                className="bg-[#4B1D63] hover:bg-[#3d174f] text-white px-6 py-3 rounded-full font-medium transition-colors shadow-sm"
              >
                + Add Teacher
              </button>
            </div>
          </div>

          <div className="bg-white rounded-t-lg overflow-hidden border border-gray-300 shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="bg-stone-300 text-gray-800 text-left text-sm font-semibold border-b border-gray-400">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Enrolled Courses</th>
                  <th className="px-4 py-3">Contact Number</th>
                  <th className="px-4 py-3">E-mail</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-300">
                {filteredTeacherList.map((item) => (
                  <tr key={item.docId} className="text-sm">
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium text-gray-900 text-lg">{item.name}</div>
                        <div className="text-gray-500 text-sm mt-1">{item.id}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700 text-base">{item.courses}</td>
                    <td className="px-4 py-3 text-gray-700 text-base">{item.phone}</td>
                    <td className="px-4 py-3 text-gray-700 text-base break-words">{item.email}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleTeacherStatus(item.docId, item.status)}
                        className={`relative inline-block w-12 h-6 rounded-full cursor-pointer transition-colors ${
                          item.status ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${
                            item.status ? 'transform translate-x-6' : ''
                          }`}
                        />
                      </button>
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      <button onClick={() => handleEditTeacher(item)} className="mr-3 hover:text-gray-700" title="Edit">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button onClick={() => handleDeleteTeacher(item.docId)} className="hover:text-red-500" title="Delete">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredTeacherList.length === 0 && (
              <div className="text-center py-10 text-gray-500">No teachers found</div>
            )}
          </div>
        </div>
      </div>

      {isStaffModalOpen && (
        <div className="fixed inset-0 bg-[#4B1D63]/35 backdrop-blur-[1px] flex items-center justify-center z-50">
          <div className="bg-[#f5f3f2] rounded-[32px] p-8 w-full max-w-2xl shadow-xl">
            <h2 className="text-4xl font-bold text-black text-center mb-10">
              {editingStaffId ? 'Update Staff' : 'Add New Staff'}
            </h2>

            <form onSubmit={handleStaffSubmit}>
              <div className="space-y-5">
                <div>
                  <label className="block text-[15px] font-semibold text-gray-900 mb-3">Full Name</label>
                  <input required type="text" name="fullName" value={staffForm.fullName} onChange={handleStaffFormChange} className="w-full h-14 px-5 rounded-full border border-gray-400 bg-white focus:outline-none" />
                </div>

                <div>
                  <label className="block text-[15px] font-semibold text-gray-900 mb-3">Staff ID</label>
                  <input readOnly type="text" name="staffId" value={staffForm.staffId} onChange={handleStaffFormChange} className="w-full h-14 px-5 rounded-full border border-gray-400 bg-gray-100 focus:outline-none cursor-not-allowed" />
                </div>

                <div>
                  <label className="block text-[15px] font-semibold text-gray-900 mb-3">Phone Number</label>
                  <input required type="text" name="phone" value={staffForm.phone} onChange={handleStaffFormChange} className={`w-full h-14 px-5 rounded-full border ${staffPhoneError ? 'border-red-500' : 'border-gray-400'} bg-white focus:outline-none`} />
                  {staffPhoneError && (
                    <div className="mt-2 text-red-500 text-sm font-medium flex items-center gap-2">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      {staffPhoneError}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[15px] font-semibold text-gray-900 mb-3">E-mail</label>
                  <input required type="email" name="email" value={staffForm.email} onChange={handleStaffFormChange} className="w-full h-14 px-5 rounded-full border border-gray-400 bg-white focus:outline-none" />
                </div>

                <div>
                  <label className="block text-[15px] font-semibold text-gray-900 mb-3">Date</label>
                  <input required type="date" name="date" value={staffForm.date} onChange={handleStaffFormChange} className="w-full h-14 px-5 rounded-full border border-gray-400 bg-white focus:outline-none" />
                </div>
              </div>

              <div className="flex justify-between gap-6 mt-12">
                <button type="button" onClick={closeStaffModal} className="w-1/2 h-14 rounded-full border border-black bg-white text-black text-2xl">
                  Cancel
                </button>

                <button type="submit" className="w-1/2 h-14 rounded-full bg-[#4B1D63] text-white text-2xl">
                  {editingStaffId ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isTeacherModalOpen && (
        <div className="fixed inset-0 bg-[#4B1D63]/35 backdrop-blur-[1px] flex items-center justify-center z-50">
          <div className="bg-[#f5f3f2] rounded-[32px] p-8 w-full max-w-2xl shadow-xl">
            <h2 className="text-4xl font-bold text-black text-center mb-10">
              {editingTeacherId ? 'Update Teacher' : 'Add New Teacher'}
            </h2>

            <form onSubmit={handleTeacherSubmit}>
              <div className="space-y-5">
                <div>
                  <label className="block text-[15px] font-semibold text-gray-900 mb-3">Name</label>
                  <input required type="text" name="name" value={teacherForm.name} onChange={handleTeacherFormChange} className="w-full h-14 px-5 rounded-full border border-gray-400 bg-white focus:outline-none" />
                </div>

                <div>
                  <label className="block text-[15px] font-semibold text-gray-900 mb-3">Teacher ID</label>
                  <input readOnly type="text" name="teacherId" value={teacherForm.teacherId} onChange={handleTeacherFormChange} className="w-full h-14 px-5 rounded-full border border-gray-400 bg-gray-100 focus:outline-none cursor-not-allowed" />
                </div>

                <div>
                  <label className="block text-[15px] font-semibold text-gray-900 mb-3">Enrolled Courses</label>
                  <input required type="text" name="courses" value={teacherForm.courses} onChange={handleTeacherFormChange} className="w-full h-14 px-5 rounded-full border border-gray-400 bg-white focus:outline-none" />
                </div>

                <div>
                  <label className="block text-[15px] font-semibold text-gray-900 mb-3">Contact Number</label>
                  <input required type="text" name="phone" value={teacherForm.phone} onChange={handleTeacherFormChange} className={`w-full h-14 px-5 rounded-full border ${teacherPhoneError ? 'border-red-500' : 'border-gray-400'} bg-white focus:outline-none`} />
                  {teacherPhoneError && (
                    <div className="mt-2 text-red-500 text-sm font-medium flex items-center gap-2">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      {teacherPhoneError}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[15px] font-semibold text-gray-900 mb-3">Email</label>
                  <input required type="email" name="email" value={teacherForm.email} onChange={handleTeacherFormChange} className="w-full h-14 px-5 rounded-full border border-gray-400 bg-white focus:outline-none" />
                </div>

                <div>
                  <label className="block text-[15px] font-semibold text-gray-900 mb-3">Date</label>
                  <input required type="date" name="date" value={teacherForm.date} onChange={handleTeacherFormChange} className="w-full h-14 px-5 rounded-full border border-gray-400 bg-white focus:outline-none" />
                </div>
              </div>

              <div className="flex justify-between gap-6 mt-12">
                <button type="button" onClick={closeTeacherModal} className="w-1/2 h-14 rounded-full border border-black bg-white text-black text-2xl">
                  Cancel
                </button>

                <button type="submit" className="w-1/2 h-14 rounded-full bg-[#4B1D63] text-white text-2xl">
                  {editingTeacherId ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}