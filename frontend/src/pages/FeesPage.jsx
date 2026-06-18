import React, { useEffect, useMemo, useRef, useState } from 'react';
import { API_BASE } from '../config';
import { logActivity } from '../utils/activityLogger';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export default function FeesPage() {
  const [payments, setPayments] = useState([]);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);

  const [searchTerm, setSearchTerm] = useState('');

  // Filter states
  const [monthFilter, setMonthFilter] = useState('');
  const [courseFilter, setCourseFilter] = useState('');

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isPendingModalOpen, setIsPendingModalOpen] = useState(false);
  const [studentSuggestionsOpen, setStudentSuggestionsOpen] = useState(false);
  const [pendingStudentSuggestionsOpen, setPendingStudentSuggestionsOpen] = useState(false);
  const studentIdInputRef = useRef(null);
  const pendingStudentIdInputRef = useRef(null);

  const [editingPaymentId, setEditingPaymentId] = useState(null);
  const [editingPendingId, setEditingPendingId] = useState(null);

  const [paymentReportDropdownOpen, setPaymentReportDropdownOpen] = useState(false);
  const [pendingReportDropdownOpen, setPendingReportDropdownOpen] = useState(false);

  const [paymentForm, setPaymentForm] = useState({
    receiptNo: '',
    studentId: '',
    studentName: '',
    courseNames: [],
    amountPaid: '',
    date: '',
  });
  const [receiptError, setReceiptError] = useState('');
  const [validationError, setValidationError] = useState('');

  const [pendingForm, setPendingForm] = useState({
    studentId: '',
    studentName: '',
    courseNames: [],
    dueAmount: '',
    dueDate: '',
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  // Function to generate the next receipt ID
  const generateNextReceiptId = (existingPayments) => {
    // Find all receipt IDs that start with 'RP' followed by digits
    const receiptIds = existingPayments
      .map(payment => payment.receiptNo)
      .filter(id => id && /^RP\d+$/.test(id))
      .map(id => parseInt(id.substring(2)))
      .filter(num => !isNaN(num));

    // Find the maximum number, or start from 99 if none exist
    const maxNum = receiptIds.length > 0 ? Math.max(...receiptIds) : 99;
    
    // Return the next ID
    return `RP${maxNum + 1}`;
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (!e.target.closest('#payment-report-dropdown') && !e.target.closest('#pending-report-dropdown')) {
        setPaymentReportDropdownOpen(false);
        setPendingReportDropdownOpen(false);
      }
      if (studentIdInputRef.current && !studentIdInputRef.current.contains(e.target)) {
        setStudentSuggestionsOpen(false);
      }
      if (pendingStudentIdInputRef.current && !pendingStudentIdInputRef.current.contains(e.target)) {
        setPendingStudentSuggestionsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchAllData = async () => {
    await Promise.all([
      fetchPayments(),
      fetchPendingPayments(),
      fetchStudents(),
      fetchCourses(),
    ]);
  };

  const fetchPayments = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/payments`);
      const data = await res.json();
      setPayments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching payments:', error);
    }
  };

  const fetchPendingPayments = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/pending-payments`);
      const data = await res.json();
      setPendingPayments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching pending payments:', error);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/students`);
      const data = await res.json();
      setStudents(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const fetchCourses = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/courses`);
      const data = await res.json();
      setCourses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const courseOptions = useMemo(() => {
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

  const studentIdSuggestions = useMemo(() => {
    const query = (paymentForm.studentId || '').trim().toLowerCase();
    if (!query) return [];

    return students
      .filter((student) => {
        const idText = String(student.id || student.studentId || '').toLowerCase();
        const nameText = String(student.name || '').toLowerCase();
        return idText.includes(query) || nameText.includes(query);
      })
      .map((student) => ({
        id: student.id || student.studentId || '',
        name: student.name || '',
      }));
  }, [paymentForm.studentId, students]);

  const pendingStudentIdSuggestions = useMemo(() => {
    const query = (pendingForm.studentId || '').trim().toLowerCase();
    if (!query) return [];

    return students
      .filter((student) => {
        const idText = String(student.id || student.studentId || '').toLowerCase();
        const nameText = String(student.name || '').toLowerCase();
        return idText.includes(query) || nameText.includes(query);
      })
      .map((student) => ({
        id: student.id || student.studentId || '',
        name: student.name || '',
      }));
  }, [pendingForm.studentId, students]);

  const getMatchedStudentName = (studentId) => {
    const match = students.find(
      (student) =>
        String(student.id || student.studentId || '').trim().toLowerCase() ===
        String(studentId || '').trim().toLowerCase()
    );
    return match ? match.name || '' : '';
  };

  const getStudentById = (studentId) => {
    return students.find(
      (student) =>
        String(student.id || student.studentId || '').trim().toLowerCase() ===
        String(studentId || '').trim().toLowerCase()
    );
  };

  const parseCourseDetails = (courseDetails) => {
    if (!courseDetails) return [];
    if (Array.isArray(courseDetails)) {
      return courseDetails.map(String).map((item) => item.trim()).filter(Boolean);
    }
    return String(courseDetails)
      .split(/[,;|]+/)
      .map((item) => item.trim())
      .filter(Boolean);
  };

  const getRelevantCourseOptions = useMemo(() => {
    const student = getStudentById(paymentForm.studentId);
    if (!student) return courseOptions;

    const studentCourseNames = parseCourseDetails(student.courseDetails);
    if (studentCourseNames.length === 0) return courseOptions;

    const normalizedNames = studentCourseNames.map((name) => name.toLowerCase());
    const matchedOptions = courseOptions.filter((option) =>
      normalizedNames.some(
        (courseName) =>
          option.toLowerCase().includes(courseName) ||
          courseName.includes(option.toLowerCase())
      )
    );

    return matchedOptions.length > 0 ? matchedOptions : courseOptions;
  }, [paymentForm.studentId, students, courseOptions]);

  const getPendingRelevantCourseOptions = useMemo(() => {
    const student = getStudentById(pendingForm.studentId);
    if (!student) return courseOptions;

    const studentCourseNames = parseCourseDetails(student.courseDetails);
    if (studentCourseNames.length === 0) return courseOptions;

    const normalizedNames = studentCourseNames.map((name) => name.toLowerCase());
    const matchedOptions = courseOptions.filter((option) =>
      normalizedNames.some(
        (courseName) =>
          option.toLowerCase().includes(courseName) ||
          courseName.includes(option.toLowerCase())
      )
    );

    return matchedOptions.length > 0 ? matchedOptions : courseOptions;
  }, [pendingForm.studentId, students, courseOptions]);

  const handlePaymentStudentIdChange = (value) => {
    setPaymentForm((prev) => ({
      ...prev,
      studentId: value,
      studentName: getMatchedStudentName(value),
      courseNames: [],
    }));
    setReceiptError('');
    setStudentSuggestionsOpen(true);
  };

  const handleSelectStudentSuggestion = (student) => {
    setPaymentForm((prev) => ({
      ...prev,
      studentId: student.id,
      studentName: student.name,
      courseNames: [],
    }));
    setStudentSuggestionsOpen(false);
  };

  const handleSelectPendingStudentSuggestion = (student) => {
    setPendingForm((prev) => ({
      ...prev,
      studentId: student.id,
      studentName: student.name,
      courseNames: [],
    }));
    setPendingStudentSuggestionsOpen(false);
  };

  const isReceiptTaken = (receipt) => {
    if (!receipt || !receipt.trim()) return false;
    return payments.some((payment) =>
      String(payment.receiptNo || '').trim().toLowerCase() === receipt.trim().toLowerCase() &&
      payment.id !== editingPaymentId
    );
  };

  const handlePendingStudentIdChange = (value) => {
    setPendingForm((prev) => ({
      ...prev,
      studentId: value,
      studentName: getMatchedStudentName(value),
    }));
    setPendingStudentSuggestionsOpen(true);
  };

  const handleMultiSelect = (e, formType) => {
    const selectedValues = Array.from(
      e.target.selectedOptions,
      (option) => option.value
    );

    if (formType === 'payment') {
      setPaymentForm((prev) => ({
        ...prev,
        courseNames: selectedValues,
      }));
    } else {
      setPendingForm((prev) => ({
        ...prev,
        courseNames: selectedValues,
      }));
    }
  };

  const resetPaymentForm = () => {
    setPaymentForm({
      receiptNo: '',
      studentId: '',
      studentName: '',
      courseNames: [],
      amountPaid: '',
      date: '',
    });
    setReceiptError('');
    setValidationError('');
    setStudentSuggestionsOpen(false);
    setEditingPaymentId(null);
  };

  const resetPendingForm = () => {
    setPendingForm({
      studentId: '',
      studentName: '',
      courseNames: [],
      dueAmount: '',
      dueDate: '',
    });
    setValidationError('');
    setPendingStudentSuggestionsOpen(false);
    setEditingPendingId(null);
  };

  const openPaymentModal = () => {
    resetPaymentForm();
    setIsPaymentModalOpen(true);
  };

  const openPendingModal = () => {
    resetPendingForm();
    setIsPendingModalOpen(true);
  };

  const closePaymentModal = () => {
    resetPaymentForm();
    setIsPaymentModalOpen(false);
  };

  const closePendingModal = () => {
    resetPendingForm();
    setIsPendingModalOpen(false);
  };

  const formatCourseNames = (courseNames) => {
    if (Array.isArray(courseNames)) return courseNames.join(', ');
    return courseNames || '';
  };

  const monthOptions = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const monthNameToNumber = (monthName) => {
    const index = monthOptions.findIndex(
      (month) => month.toLowerCase() === monthName.toLowerCase()
    );
    return index !== -1 ? String(index + 1).padStart(2, '0') : '';
  };

  const parseMonthDateValue = (value) => {
    if (!value) return { year: '', month: '' };
    const trimmed = String(value).trim();

    const fullDateMatch = trimmed.match(/^(\d{4})-(\d{2})(?:-(\d{2}))?$/);
    if (fullDateMatch) {
      return { year: fullDateMatch[1], month: fullDateMatch[2] };
    }

    const yearMonthNameMatch = trimmed.match(/^(\d{4})-(.+)$/);
    if (yearMonthNameMatch) {
      const month = monthNameToNumber(yearMonthNameMatch[2]);
      if (month) return { year: yearMonthNameMatch[1], month };
    }

    const monthYearMatch = trimmed.match(/^([A-Za-z]+)\s+(\d{4})$/);
    if (monthYearMatch) {
      const month = monthNameToNumber(monthYearMatch[1]);
      if (month) return { year: monthYearMatch[2], month };
    }

    const monthOnly = monthNameToNumber(trimmed);
    if (monthOnly) {
      return { year: String(new Date().getFullYear()), month: monthOnly };
    }

    return { year: '', month: '' };
  };

  const normalizeMonthDate = (value) => {
    const { year, month } = parseMonthDateValue(value);
    return year && month ? `${year}-${month}-01` : '';
  };

  const formatPaymentDate = (dateValue) => {
    if (!dateValue) return '';
    const { year, month } = parseMonthDateValue(dateValue);
    if (!year || !month) return String(dateValue);
    return `${monthOptions[Number(month) - 1]} ${year}`;
  };

  const handleExportPaymentsPDF = () => {
    const doc = new jsPDF();
    const tableColumn = ["Receipt No.", "Student ID", "Student Name", "Course Name", "Amount Paid", "Date"];
    const tableRows = [];
    filteredPayments.forEach(payment => {
      tableRows.push([
        payment.receiptNo || '',
        payment.studentId || '',
        payment.studentName || '',
        formatCourseNames(payment.courseNames),
        payment.amountPaid || payment.amount || '',
        payment.date || '',
      ]);
    });
    autoTable(doc, { head: [tableColumn], body: tableRows, startY: 20 });
    doc.text(`Roots Institute - Recent Payments Report`, 14, 15);
    doc.save(`payments_report.pdf`);
    setPaymentReportDropdownOpen(false);
  };

  const handleExportPaymentsExcel = () => {
    const excelData = filteredPayments.map(payment => ({
      "Receipt No.": payment.receiptNo || '',
      "Student ID": payment.studentId || '',
      "Student Name": payment.studentName || '',
      "Course Name": formatCourseNames(payment.courseNames),
      "Amount Paid": payment.amountPaid || payment.amount || '',
      "Date": payment.date || '',
    }));
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Payments");
    XLSX.writeFile(workbook, `payments_report.xlsx`);
    setPaymentReportDropdownOpen(false);
  };

  const handleExportPendingPDF = () => {
    const doc = new jsPDF();
    const tableColumn = ["Student ID", "Student Name", "Course Name", "Due Amount", "Date"];
    const tableRows = [];
    filteredPendingPayments.forEach(pending => {
      tableRows.push([
        pending.studentId || '',
        pending.studentName || '',
        formatCourseNames(pending.courseNames),
        pending.dueAmount || '',
        formatPaymentDate(pending.dueDate || pending.dueMonth) || '',
      ]);
    });
    autoTable(doc, { head: [tableColumn], body: tableRows, startY: 20 });
    doc.text(`Roots Institute - Pending Payments Report`, 14, 15);
    doc.save(`pending_payments_report.pdf`);
    setPendingReportDropdownOpen(false);
  };

  const handleExportPendingExcel = () => {
    const excelData = filteredPendingPayments.map(pending => ({
      "Student ID": pending.studentId || '',
      "Student Name": pending.studentName || '',
      "Course Name": formatCourseNames(pending.courseNames),
      "Due Amount": pending.dueAmount || '',
      "Date": formatPaymentDate(pending.dueDate || pending.dueMonth) || '',
    }));
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Pending Payments");
    XLSX.writeFile(workbook, `pending_payments_report.xlsx`);
    setPendingReportDropdownOpen(false);
  };

  const downloadReceipt = (payment) => {
    const courseText = formatCourseNames(payment.courseNames);
    const receiptHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8" />
        <title>Receipt ${payment.receiptNo}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            background: #f5f3f2;
            padding: 40px;
            color: #222;
          }
          .receipt-box {
            max-width: 700px;
            margin: 0 auto;
            background: #ffffff;
            border: 2px solid #4B1D63;
            border-radius: 18px;
            padding: 30px;
          }
          .title {
            text-align: center;
            color: #4B1D63;
            font-size: 32px;
            font-weight: bold;
            margin-bottom: 8px;
          }
          .subtitle {
            text-align: center;
            color: #666;
            margin-bottom: 30px;
          }
          .row {
            display: flex;
            border-bottom: 1px solid #ddd;
            padding: 12px 0;
          }
          .label {
            width: 220px;
            font-weight: bold;
            color: #4B1D63;
          }
          .value {
            flex: 1;
          }
          .footer {
            margin-top: 30px;
            text-align: center;
            color: #666;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="receipt-box">
          <div class="title">Payment Receipt</div>
          <div class="subtitle">Roots Institute Management System</div>

          <div class="row"><div class="label">Receipt No</div><div class="value">${payment.receiptNo}</div></div>
          <div class="row"><div class="label">Student ID</div><div class="value">${payment.studentId}</div></div>
          <div class="row"><div class="label">Student Name</div><div class="value">${payment.studentName}</div></div>
          <div class="row"><div class="label">Course Name</div><div class="value">${courseText}</div></div>
          <div class="row"><div class="label">Amount Paid</div><div class="value">${payment.amountPaid}</div></div>
          <div class="row"><div class="label">Date</div><div class="value">${payment.date}</div></div>

          <div class="footer">
            This is a system generated receipt.
          </div>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([receiptHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `receipt_${payment.receiptNo || 'payment'}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSavePayment = async (e) => {
    e.preventDefault();

    // Validation: Check if all required fields are filled
    if (!paymentForm.studentId.trim() || 
        !paymentForm.studentName.trim() || paymentForm.courseNames.length === 0 || 
        !paymentForm.amountPaid.trim() || !paymentForm.date.trim()) {
      setValidationError('Please fill all the fields');
      return;
    }

    setValidationError('');

    // Generate receipt ID automatically for new payments
    let receiptId = paymentForm.receiptNo;
    if (!editingPaymentId) {
      receiptId = generateNextReceiptId(payments);
    }

    if (isReceiptTaken(receiptId)) {
      setReceiptError('This Receipt Number already taken');
      return;
    }

    const payload = {
      receiptNo: receiptId,
      studentId: paymentForm.studentId,
      studentName: paymentForm.studentName,
      courseNames: paymentForm.courseNames,
      amountPaid: paymentForm.amountPaid,
      date: paymentForm.date,
    };

    try {
      const url = editingPaymentId
        ? `${API_BASE}/api/payments/${editingPaymentId}`
        : `${API_BASE}/api/payments`;

      const method = editingPaymentId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        if (editingPaymentId) {
          logActivity(`Payment for ${paymentForm.studentName} was updated.`);
        } else {
          logActivity(`Payment for ${paymentForm.studentName} was added.`);

          const wantDownload = window.confirm('Do you want to download the receipt?');
          if (wantDownload) {
            downloadReceipt(payload);
          }
        }

        await fetchPayments();
        closePaymentModal();
      }
    } catch (error) {
      console.error('Error saving payment:', error);
    }
  };

  const handleSavePending = async (e) => {
    e.preventDefault();

    // Validation: Check if all required fields are filled
    if (!pendingForm.studentId.trim() || !pendingForm.studentName.trim() || 
        pendingForm.courseNames.length === 0 || !pendingForm.dueAmount.trim() || 
        !pendingForm.dueDate.trim()) {
      setValidationError('Please fill all the fields');
      return;
    }

    setValidationError('');

    const payload = {
      studentId: pendingForm.studentId,
      studentName: pendingForm.studentName,
      courseNames: pendingForm.courseNames,
      dueAmount: pendingForm.dueAmount,
      dueDate: pendingForm.dueDate,
    };

    try {
      const url = editingPendingId
        ? `${API_BASE}/api/pending-payments/${editingPendingId}`
        : `${API_BASE}/api/pending-payments`;

      const method = editingPendingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        if (editingPendingId) {
          logActivity(`Pending payment for ${pendingForm.studentName} was updated.`);
        } else {
          logActivity(`Pending payment for ${pendingForm.studentName} was added.`);
        }
        await fetchPendingPayments();
        closePendingModal();
      }
    } catch (error) {
      console.error('Error saving pending payment:', error);
    }
  };

  const handleEditPayment = (item) => {
    setEditingPaymentId(item.id);
    setPaymentForm({
      receiptNo: item.receiptNo || '',
      studentId: item.studentId || '',
      studentName: item.studentName || '',
      courseNames: Array.isArray(item.courseNames)
        ? item.courseNames
        : item.courseName
        ? [item.courseName]
        : [],
      amountPaid: item.amountPaid || item.amount || '',
      date: normalizeMonthDate(item.date || ''),
    });
    setIsPaymentModalOpen(true);
  };

  const handleEditPending = (item) => {
    setEditingPendingId(item.id);
    setPendingForm({
      studentId: item.studentId || '',
      studentName: item.studentName || '',
      courseNames: Array.isArray(item.courseNames)
        ? item.courseNames
        : item.courseName
        ? [item.courseName]
        : [],
      dueAmount: item.dueAmount || '',
      dueDate: normalizeMonthDate(item.dueDate || item.dueMonth || ''),
    });
    setIsPendingModalOpen(true);
  };

  const handleDeletePayment = async (id, studentName) => {
    const ok = window.confirm('Are you sure you want to delete this payment record?');
    if (!ok) return;

    try {
      const res = await fetch(`${API_BASE}/api/payments/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        logActivity(`Payment for ${studentName} was deleted.`);
        fetchPayments();
      }
    } catch (error) {
      console.error('Error deleting payment:', error);
    }
  };

  const handleSendPaymentEmail = async (paymentId, studentName) => {
    try {
      const response = await fetch(`${API_BASE}/api/payments/${paymentId}/payment-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        alert(`Success! Payment confirmation email sent to ${studentName}`);
        logActivity(`Payment confirmation email successfully sent to ${studentName}.`);
      } else {
        console.error('Email send failed:', data);
        alert(`Failed to send email: ${data.error || 'Unknown error occurred'}`);
      }
    } catch (error) {
      console.error('Network error:', error);
      alert(`Network Error: ${error.message}`);
    }
  };

  const handleSendPendingPaymentEmail = async (pendingPaymentId, studentName) => {
    try {
      const response = await fetch(`${API_BASE}/api/pending-payments/${pendingPaymentId}/payment-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        alert(`Success! Payment reminder email sent to ${studentName}`);
        logActivity(`Payment reminder email successfully sent to ${studentName}.`);
      } else {
        console.error('Email send failed:', data);
        alert(`Failed to send email: ${data.error || 'Unknown error occurred'}`);
      }
    } catch (error) {
      console.error('Network error:', error);
      alert(`Network Error: ${error.message}`);
    }
  };

  const handleDeletePending = async (id, studentName) => {
    const ok = window.confirm('Are you sure you want to delete this pending payment record?');
    if (!ok) return;

    try {
      const res = await fetch(`${API_BASE}/api/pending-payments/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        logActivity(`Pending payment for ${studentName} was deleted.`);
        fetchPendingPayments();
      }
    } catch (error) {
      console.error('Error deleting pending payment:', error);
    }
  };

  const filteredPayments = useMemo(() => {
    return payments.filter((item) => {
      const q = searchTerm.toLowerCase();
      const itemCourses = Array.isArray(item.courseNames)
        ? item.courseNames.join(', ')
        : item.courseName || '';

      // Search term filter
      const matchesSearch = !q ||
        String(item.studentName || '').toLowerCase().includes(q) ||
        String(item.studentId || '').toLowerCase().includes(q) ||
        String(item.receiptNo || '').toLowerCase().includes(q) ||
        itemCourses.toLowerCase().includes(q);

      // Month filter (check date)
      const matchesMonth = !monthFilter || (() => {
        const month = parseMonthDateValue(item.date).month;
        return month === monthFilter;
      })();

      // Course filter
      const matchesCourse = !courseFilter || itemCourses.toLowerCase().includes(courseFilter.toLowerCase());

      return matchesSearch && matchesMonth && matchesCourse;
    });
  }, [payments, searchTerm, monthFilter, courseFilter]);

  const filteredPendingPayments = useMemo(() => {
    return pendingPayments.filter((item) => {
      const q = searchTerm.toLowerCase();
      const itemCourses = Array.isArray(item.courseNames)
        ? item.courseNames.join(', ')
        : item.courseName || '';

      // Search term filter
      const matchesSearch = !q ||
        String(item.studentName || '').toLowerCase().includes(q) ||
        String(item.studentId || '').toLowerCase().includes(q) ||
        itemCourses.toLowerCase().includes(q);

      // Month filter (check dueDate or dueMonth)
      const matchesMonth = !monthFilter || (() => {
        const dateValue = item.dueDate || item.dueMonth;
        const month = parseMonthDateValue(dateValue).month;
        return month === monthFilter;
      })();

      // Course filter
      const matchesCourse = !courseFilter || itemCourses.toLowerCase().includes(courseFilter.toLowerCase());

      return matchesSearch && matchesMonth && matchesCourse;
    });
  }, [pendingPayments, searchTerm, monthFilter, courseFilter]);

  return (
    <div className="flex-1 flex flex-col bg-secondary overflow-hidden">
      <div className="bg-[#E6E6E6] px-10 py-3 border-b border-gray-300">
        <h2 className="text-xs font-bold text-gray-500 tracking-widest uppercase">
          FEES
        </h2>
      </div>

      <div className="bg-secondary px-10 pt-8 pb-6">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold mb-2 text-gray-900">Fee & Payment Management</h1>
          </div>

          <div className="w-full lg:w-auto">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Student Name/ID or Receipt No"
              className="w-full md:w-[420px] h-12 px-4 rounded-full border border-gray-300 bg-white focus:outline-none"
            />
          </div>
        </div>

        {/* Filter Options */}
        <div className="flex flex-wrap gap-4 mt-4">
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">Filter by Month</label>
            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#4B1D63]/50"
            >
              <option value="">All Months</option>
              <option value="01">January</option>
              <option value="02">February</option>
              <option value="03">March</option>
              <option value="04">April</option>
              <option value="05">May</option>
              <option value="06">June</option>
              <option value="07">July</option>
              <option value="08">August</option>
              <option value="09">September</option>
              <option value="10">October</option>
              <option value="11">November</option>
              <option value="12">December</option>
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">Filter by Course</label>
            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#4B1D63]/50"
            >
              <option value="">All Courses</option>
              {courseOptions.map((course, index) => (
                <option key={index} value={course}>{course}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setMonthFilter('');
                setCourseFilter('');
              }}
              className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      <div className="px-10 flex-1 overflow-auto pb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-3xl font-bold text-black">Recent payments</h2>
          <div className="flex items-center gap-3">
            <div className="relative" id="payment-report-dropdown">
              <button
                type="button"
                onClick={() => setPaymentReportDropdownOpen(!paymentReportDropdownOpen)}
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

              {paymentReportDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-100 rounded-lg shadow-lg py-2 z-10">
                  <button type="button" onClick={() => handleExportPaymentsPDF()} className="block w-full text-left px-5 py-2 text-sm text-gray-700 hover:bg-[#d9cde4] flex justify-between items-center transition-colors">
                    Export to PDF <span className="text-red-500 font-bold text-xs bg-red-50 px-2 py-0.5 rounded">PDF</span>
                  </button>
                  <button type="button" onClick={() => handleExportPaymentsExcel()} className="block w-full text-left px-5 py-2 text-sm text-gray-700 hover:bg-[#d9cde4] flex justify-between items-center transition-colors">
                    Export to Excel <span className="text-green-600 font-bold text-xs bg-green-50 px-2 py-0.5 rounded">XLS</span>
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={openPaymentModal}
              className="bg-[#4B1D63] hover:bg-[#3d174f] text-white px-6 py-3 rounded-full text-lg"
            >
              + Add New Payment
            </button>
          </div>
        </div>

        <div className="bg-white rounded-t-lg overflow-hidden border border-gray-300 shadow-sm mb-10">
          <table className="w-full">
            <thead>
              <tr className="bg-stone-300 text-gray-800 text-left text-sm font-semibold border-b border-gray-400">
                <th className="px-6 py-4">Receipt No.</th>
                <th className="px-6 py-4">Student ID</th>
                <th className="px-6 py-4">Student Name</th>
                <th className="px-6 py-4">Course Name</th>
                <th className="px-6 py-4">Amount Paid</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-300">
              {filteredPayments.map((item) => (
                <tr key={item.id} className="text-sm">
                  <td className="px-6 py-4">{item.receiptNo}</td>
                  <td className="px-6 py-4">{item.studentId}</td>
                  <td className="px-6 py-4">{item.studentName}</td>
                  <td className="px-6 py-4">
                    {Array.isArray(item.courseNames)
                      ? item.courseNames.join(', ')
                      : item.courseName || ''}
                  </td>
                  <td className="px-6 py-4">{item.amountPaid || item.amount}</td>
                  <td className="px-6 py-4">{formatPaymentDate(item.date) || '-'}</td>
                  <td className="px-6 py-4 text-gray-500">
                    <button onClick={() => handleEditPayment(item)} className="mr-3 hover:text-gray-700">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button onClick={() => handleDeletePayment(item.id, item.studentName)} className="mr-3 hover:text-red-500">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                    <button onClick={() => handleSendPaymentEmail(item.id, item.studentName)} className="hover:text-blue-500">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredPayments.length === 0 && (
            <div className="text-center py-10 text-gray-500">No payment records found</div>
          )}
        </div>

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-3xl font-bold text-black">Pending payments</h2>
          <div className="flex items-center gap-3">
            <div className="relative" id="pending-report-dropdown">
              <button
                type="button"
                onClick={() => setPendingReportDropdownOpen(!pendingReportDropdownOpen)}
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

              {pendingReportDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-100 rounded-lg shadow-lg py-2 z-10">
                  <button type="button" onClick={() => handleExportPendingPDF()} className="block w-full text-left px-5 py-2 text-sm text-gray-700 hover:bg-[#d9cde4] flex justify-between items-center transition-colors">
                    Export to PDF <span className="text-red-500 font-bold text-xs bg-red-50 px-2 py-0.5 rounded">PDF</span>
                  </button>
                  <button type="button" onClick={() => handleExportPendingExcel()} className="block w-full text-left px-5 py-2 text-sm text-gray-700 hover:bg-[#d9cde4] flex justify-between items-center transition-colors">
                    Export to Excel <span className="text-green-600 font-bold text-xs bg-green-50 px-2 py-0.5 rounded">XLS</span>
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={openPendingModal}
              className="bg-[#4B1D63] hover:bg-[#3d174f] text-white px-6 py-3 rounded-full text-lg"
            >
              + Add Pending Payment
            </button>
          </div>
        </div>

        <div className="bg-white rounded-t-lg overflow-hidden border border-gray-300 shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="bg-stone-300 text-gray-800 text-left text-sm font-semibold border-b border-gray-400">
                <th className="px-6 py-4">Student ID</th>
                <th className="px-6 py-4">Student Name</th>
                <th className="px-6 py-4">Course Name</th>
                <th className="px-6 py-4">Due Amount</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-300">
              {filteredPendingPayments.map((item) => (
                <tr key={item.id} className="text-sm">
                  <td className="px-6 py-4">{item.studentId}</td>
                  <td className="px-6 py-4">{item.studentName}</td>
                  <td className="px-6 py-4">
                    {Array.isArray(item.courseNames)
                      ? item.courseNames.join(', ')
                      : item.courseName || ''}
                  </td>
                  <td className="px-6 py-4">{item.dueAmount}</td>
                  <td className="px-6 py-4">{formatPaymentDate(item.dueDate || item.dueMonth)}</td>
                  <td className="px-6 py-4 text-gray-500">
                    <button onClick={() => handleEditPending(item)} className="mr-3 hover:text-gray-700">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button onClick={() => handleDeletePending(item.id, item.studentName)} className="mr-3 hover:text-red-500">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                    <button onClick={() => handleSendPendingPaymentEmail(item.id, item.studentName)} className="hover:text-blue-500">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredPendingPayments.length === 0 && (
            <div className="text-center py-10 text-gray-500">No pending payment records found</div>
          )}
        </div>
      </div>

      {isPaymentModalOpen && (
        <div className="fixed inset-0 bg-[#4B1D63]/35 backdrop-blur-[1px] flex items-center justify-center z-50">
          <div className="bg-[#f5f3f2] rounded-[28px] p-8 w-full max-w-4xl shadow-xl relative">
            <button
              onClick={closePaymentModal}
              className="absolute top-5 right-7 text-4xl text-black leading-none"
              type="button"
            >
              ×
            </button>

            <h2 className="text-3xl md:text-4xl font-bold text-black mb-10">
              {editingPaymentId ? 'Edit Payment' : 'Add New Payment'}
            </h2>

            <form onSubmit={handleSavePayment}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div>
                  <label className="block text-[15px] font-semibold text-gray-900 mb-3">Receipt No</label>
                  {editingPaymentId ? (
                    // Editing mode: show receipt ID as read-only
                    <input
                      required
                      type="text"
                      value={paymentForm.receiptNo}
                      className="w-full h-14 px-5 rounded-full border border-gray-300 bg-gray-100 text-gray-700 cursor-not-allowed"
                      readOnly
                    />
                  ) : (
                    // Adding mode: hide receipt ID field since it's auto-generated
                    <div className="w-full h-14 px-5 rounded-full border border-gray-300 bg-gray-50 text-gray-500 italic flex items-center">
                      Auto-generated (RP100, RP101, etc.)
                    </div>
                  )}
                  {receiptError && (
                    <p className="text-xs text-red-600 mt-2">{receiptError}</p>
                  )}
                </div>

                <div ref={studentIdInputRef} className="relative">
                  <label className="block text-[15px] font-semibold text-gray-900 mb-3">Student ID</label>
                  <input
                    required
                    type="text"
                    value={paymentForm.studentId}
                    onChange={(e) => handlePaymentStudentIdChange(e.target.value)}
                    onFocus={() => setStudentSuggestionsOpen(true)}
                    className="w-full h-14 px-5 rounded-full border border-gray-300 bg-white focus:outline-none"
                    autoComplete="off"
                  />
                  {studentSuggestionsOpen && paymentForm.studentId.trim().length > 0 && (
                    <div className="absolute z-50 top-full left-0 right-0 mt-2 max-h-52 overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-2xl">
                      {studentIdSuggestions.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-gray-500">No students found</div>
                      ) : (
                        studentIdSuggestions.map((student) => (
                          <button
                            key={student.id}
                            type="button"
                            onMouseDown={() => handleSelectStudentSuggestion(student)}
                            className="w-full text-left px-4 py-3 text-sm border-b border-gray-100 hover:bg-gray-50 transition-colors"
                          >
                            <span className="font-semibold">{student.id}</span>
                            <span className="text-gray-500 ml-2">{student.name}</span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                  <div className="mt-2 rounded-2xl border border-[#FDE68A] bg-[#FEF9C3] px-4 py-3 text-sm text-[#92400E] shadow-sm">
                    {paymentForm.studentId ? (
                      getStudentById(paymentForm.studentId) ? (
                        getRelevantCourseOptions.length > 0 ? (
                          <>
                            <span className="font-semibold">Available courses:</span>{' '}
                            {getRelevantCourseOptions.join(', ')}
                          </>
                        ) : (
                          'No relevant course list was found for this student. Showing all available courses.'
                        )
                      ) : (
                        'Student ID not found. Enter a valid student ID to see available courses.'
                      )
                    ) : (
                      '⚠️ Enter a student ID first to see available courses'
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-[15px] font-semibold text-gray-900 mb-3">Student Name</label>
                  <input
                    type="text"
                    value={paymentForm.studentName}
                    readOnly
                    className="w-full h-14 px-5 rounded-full border border-gray-300 bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[15px] font-semibold text-gray-900 mb-3">Course Name</label>
                  <select
                    multiple
                    required
                    value={paymentForm.courseNames}
                    onChange={(e) => handleMultiSelect(e, 'payment')}
                    className="w-full min-h-[130px] px-4 py-3 rounded-3xl border border-gray-300 bg-white focus:outline-none"
                  >
                    {getRelevantCourseOptions.map((courseName, index) => (
                      <option key={index} value={courseName}>
                        {courseName}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-2">You can select two or more courses.</p>
                </div>

                <div>
                  <label className="block text-[15px] font-semibold text-gray-900 mb-3">Amount Paid</label>
                  <input
                    required
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={paymentForm.amountPaid}
                    onChange={(e) => setPaymentForm((prev) => ({ ...prev, amountPaid: e.target.value }))}
                    className="w-full h-14 px-5 rounded-full border border-gray-300 bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[15px] font-semibold text-gray-900 mb-3">Date</label>
                  <select
                    required
                    value={paymentForm.date}
                    onChange={(e) => setPaymentForm((prev) => ({ ...prev, date: e.target.value }))}
                    className="w-full h-14 px-5 rounded-full border border-gray-300 bg-white focus:outline-none"
                  >
                    <option value="">Select a month</option>
                    {monthOptions.map((month, index) => {
                      const monthNum = (index + 1).toString().padStart(2, '0');
                      const year = new Date().getFullYear();
                      return (
                        <option key={month} value={`${year}-${monthNum}-01`}>
                          {month} {year}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {validationError && (
                <div className="mt-4 p-3 rounded-lg bg-red-100 border border-red-400 text-red-700 text-center">
                  {validationError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-10">
                <button
                  type="button"
                  onClick={closePaymentModal}
                  className="h-14 rounded-full border border-gray-700 bg-white text-black text-xl"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="h-14 rounded-full bg-[#4B1D63] text-white text-xl"
                >
                  {editingPaymentId ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isPendingModalOpen && (
        <div className="fixed inset-0 bg-[#4B1D63]/35 backdrop-blur-[1px] flex items-center justify-center z-50">
          <div className="bg-[#f5f3f2] rounded-[28px] p-8 w-full max-w-4xl shadow-xl relative">
            <button
              onClick={closePendingModal}
              className="absolute top-5 right-7 text-4xl text-black leading-none"
              type="button"
            >
              ×
            </button>

            <h2 className="text-3xl md:text-4xl font-bold text-black mb-10">
              {editingPendingId ? 'Edit Pending Payment' : 'Add New Pending Payment'}
            </h2>

            <form onSubmit={handleSavePending}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div ref={pendingStudentIdInputRef} className="relative">
                  <label className="block text-[15px] font-semibold text-gray-900 mb-3">Student ID</label>
                  <input
                    required
                    type="text"
                    value={pendingForm.studentId}
                    onChange={(e) => handlePendingStudentIdChange(e.target.value)}
                    onFocus={() => setPendingStudentSuggestionsOpen(true)}
                    className="w-full h-14 px-5 rounded-full border border-gray-300 bg-white focus:outline-none"
                    autoComplete="off"
                  />
                  {pendingStudentSuggestionsOpen && pendingForm.studentId.trim().length > 0 && (
                    <div className="absolute z-50 top-full left-0 right-0 mt-2 max-h-52 overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-2xl">
                      {pendingStudentIdSuggestions.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-gray-500">No students found</div>
                      ) : (
                        pendingStudentIdSuggestions.map((student) => (
                          <button
                            key={student.id}
                            type="button"
                            onMouseDown={() => handleSelectPendingStudentSuggestion(student)}
                            className="w-full text-left px-4 py-3 text-sm border-b border-gray-100 hover:bg-gray-50 transition-colors"
                          >
                            <span className="font-semibold">{student.id}</span>
                            <span className="text-gray-500 ml-2">{student.name}</span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                  <div className="mt-2 rounded-2xl border border-[#FDE68A] bg-[#FEF9C3] px-4 py-3 text-sm text-[#92400E] shadow-sm">
                    {pendingForm.studentId ? (
                      getStudentById(pendingForm.studentId) ? (
                        getPendingRelevantCourseOptions.length > 0 ? (
                          <>
                            <span className="font-semibold">Available courses:</span>{' '}
                            {getPendingRelevantCourseOptions.join(', ')}
                          </>
                        ) : (
                          'No relevant course list was found for this student. Showing all available courses.'
                        )
                      ) : (
                        'Student ID not found. Enter a valid student ID to see available courses.'
                      )
                    ) : (
                      '⚠️ Enter a student ID first to see available courses'
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-[15px] font-semibold text-gray-900 mb-3">Student Name</label>
                  <input
                    type="text"
                    value={pendingForm.studentName}
                    readOnly
                    className="w-full h-14 px-5 rounded-full border border-gray-300 bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[15px] font-semibold text-gray-900 mb-3">Course Name</label>
                  <select
                    multiple
                    required
                    value={pendingForm.courseNames}
                    onChange={(e) => handleMultiSelect(e, 'pending')}
                    className="w-full min-h-[130px] px-4 py-3 rounded-3xl border border-gray-300 bg-white focus:outline-none"
                  >
                    {getPendingRelevantCourseOptions.map((courseName, index) => (
                      <option key={index} value={courseName}>
                        {courseName}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-2">You can select two or more courses.</p>
                </div>

                <div>
                  <label className="block text-[15px] font-semibold text-gray-900 mb-3">Due Amount</label>
                  <input
                    required
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={pendingForm.dueAmount}
                    onChange={(e) => setPendingForm((prev) => ({ ...prev, dueAmount: e.target.value }))}
                    className="w-full h-14 px-5 rounded-full border border-gray-300 bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[15px] font-semibold text-gray-900 mb-3">Date</label>
                  <select
                    required
                    value={pendingForm.dueDate}
                    onChange={(e) => setPendingForm((prev) => ({ ...prev, dueDate: e.target.value }))}
                    className="w-full h-14 px-5 rounded-full border border-gray-300 bg-white focus:outline-none"
                  >
                    <option value="">Select a month</option>
                    {monthOptions.map((month, index) => {
                      const monthNum = String(index + 1).padStart(2, '0');
                      const year = new Date().getFullYear();
                      return (
                        <option key={month} value={`${year}-${monthNum}-01`}>
                          {month} {year}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {validationError && (
                <div className="mt-4 p-3 rounded-lg bg-red-100 border border-red-400 text-red-700 text-center">
                  {validationError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-10">
                <button
                  type="button"
                  onClick={closePendingModal}
                  className="h-14 rounded-full border border-gray-700 bg-white text-black text-xl"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="h-14 rounded-full bg-[#4B1D63] text-white text-xl"
                >
                  {editingPendingId ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}