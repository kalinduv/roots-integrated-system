import React, { useEffect, useMemo, useState } from 'react';
import { API_BASE } from '../config';
import { CalendarDays, Pencil, ReceiptText, Trash2, X } from 'lucide-react';

const emptyPaymentForm = {
  receiptNo: '',
  studentId: '',
  studentName: '',
  amount: '',
  date: '',
  status: 'Completed',
};

const emptyPendingForm = {
  studentId: '',
  studentName: '',
  dueAmount: '',
  dueDate: '',
  status: 'Pending',
};

const formatCurrency = (amount) => {
  const value = Number(amount || 0);
  return `RS. ${value.toLocaleString()}`;
};

const formatDateForInput = (value) => {
  if (!value) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toISOString().split('T')[0];
};

const formatDateForDisplay = (value) => {
  if (!value) return '-';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-');
    return `${day}/${month}/${year}`;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('en-GB');
};

const FeesDashboard = () => {
  const [payments, setPayments] = useState([]);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [pendingModalOpen, setPendingModalOpen] = useState(false);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [editingPaymentId, setEditingPaymentId] = useState(null);
  const [editingPendingId, setEditingPendingId] = useState(null);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [paymentForm, setPaymentForm] = useState(emptyPaymentForm);
  const [pendingForm, setPendingForm] = useState(emptyPendingForm);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [paymentsRes, pendingRes] = await Promise.all([
        fetch(`${API_BASE}/api/payments`),
        fetch(`${API_BASE}/api/pending-payments`),
      ]);

      const paymentsData = paymentsRes.ok ? await paymentsRes.json() : [];
      const pendingData = pendingRes.ok ? await pendingRes.json() : [];

      setPayments(Array.isArray(paymentsData) ? paymentsData : []);
      setPendingPayments(Array.isArray(pendingData) ? pendingData : []);
    } catch (error) {
      console.error('Error fetching fees data:', error);
    } finally {
      setLoading(false);
    }
  };

  const summary = useMemo(() => {
    const collected = payments.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const pending = pendingPayments.reduce((sum, item) => sum + Number(item.dueAmount || 0), 0);
    return {
      collected,
      pending,
      total: collected + pending,
    };
  }, [payments, pendingPayments]);

  const recentPayments = useMemo(() => {
    return [...payments]
      .sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt))
      .slice(0, 5);
  }, [payments]);

  const recentPending = useMemo(() => {
    return [...pendingPayments]
      .sort((a, b) => new Date(a.dueDate || a.createdAt) - new Date(b.dueDate || b.createdAt))
      .slice(0, 5);
  }, [pendingPayments]);

  const resetPaymentModal = () => {
    setEditingPaymentId(null);
    setPaymentForm(emptyPaymentForm);
    setPaymentModalOpen(false);
  };

  const resetPendingModal = () => {
    setEditingPendingId(null);
    setPendingForm(emptyPendingForm);
    setPendingModalOpen(false);
  };

  const handlePaymentInputChange = (e) => {
    const { name, value } = e.target;
    setPaymentForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePendingInputChange = (e) => {
    const { name, value } = e.target;
    setPendingForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSavePayment = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...paymentForm,
        amount: Number(paymentForm.amount),
      };

      const url = editingPaymentId
        ? `${API_BASE}/api/payments/${editingPaymentId}`
        : `${API_BASE}/api/payments`;

      const response = await fetch(url, {
        method: editingPaymentId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const savedPayment = await response.json();
        await fetchAllData();
        resetPaymentModal();
        setSelectedReceipt(savedPayment);
        setReceiptModalOpen(true);
      }
    } catch (error) {
      console.error('Error saving payment:', error);
    }
  };

  const handleSavePending = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...pendingForm,
        dueAmount: Number(pendingForm.dueAmount),
      };

      const url = editingPendingId
        ? `${API_BASE}/api/pending-payments/${editingPendingId}`
        : `${API_BASE}/api/pending-payments`;

      const response = await fetch(url, {
        method: editingPendingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        await fetchAllData();
        resetPendingModal();
      }
    } catch (error) {
      console.error('Error saving pending payment:', error);
    }
  };

  const handleEditPayment = (payment) => {
    setEditingPaymentId(payment.id);
    setPaymentForm({
      receiptNo: payment.receiptNo || '',
      studentId: payment.studentId || '',
      studentName: payment.studentName || '',
      amount: payment.amount || '',
      date: formatDateForInput(payment.date),
      status: payment.status || 'Completed',
    });
    setPaymentModalOpen(true);
  };

  const handleEditPending = (pending) => {
    setEditingPendingId(pending.id);
    setPendingForm({
      studentId: pending.studentId || '',
      studentName: pending.studentName || '',
      dueAmount: pending.dueAmount || '',
      dueDate: formatDateForInput(pending.dueDate),
      status: pending.status || 'Pending',
    });
    setPendingModalOpen(true);
  };

  const handleDeletePayment = async (id) => {
    if (!window.confirm('Are you sure you want to remove this payment entry?')) return;

    try {
      const response = await fetch(`${API_BASE}/api/payments/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        await fetchAllData();
      }
    } catch (error) {
      console.error('Error deleting payment:', error);
    }
  };

  const handleDeletePending = async (id) => {
    if (!window.confirm('Are you sure you want to remove this pending payment entry?')) return;

    try {
      const response = await fetch(`${API_BASE}/api/pending-payments/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        await fetchAllData();
      }
    } catch (error) {
      console.error('Error deleting pending payment:', error);
    }
  };

  const handleMarkAsPaid = async (pendingItem) => {
    try {
      const paymentPayload = {
        receiptNo: `RP${String(Date.now()).slice(-4)}`,
        studentId: pendingItem.studentId,
        studentName: pendingItem.studentName,
        amount: Number(pendingItem.dueAmount),
        date: new Date().toISOString().split('T')[0],
        status: 'Completed',
      };

      const createResponse = await fetch(`${API_BASE}/api/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentPayload),
      });

      if (createResponse.ok) {
        await fetch(`${API_BASE}/api/pending-payments/${pendingItem.id}`, {
          method: 'DELETE',
        });
        const savedPayment = await createResponse.json();
        await fetchAllData();
        setSelectedReceipt(savedPayment);
        setReceiptModalOpen(true);
      }
    } catch (error) {
      console.error('Error marking payment as paid:', error);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-secondary overflow-hidden">
      <div className="bg-[#D9D6D6] px-6 md:px-10 py-4 border-b border-gray-300">
        <h1 className="text-2xl md:text-3xl font-medium text-gray-900 tracking-wide">
          FEE & PAYMENT MANAGEMENT
        </h1>
      </div>

      <div className="px-6 md:px-10 py-8 flex-1 overflow-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 max-w-6xl">
          <SummaryCard title="Total Fees Due" value={formatCurrency(summary.total)} bgColor="bg-[#4B84D3]" />
          <SummaryCard title="Fees Collected" value={formatCurrency(summary.collected)} bgColor="bg-[#2EA043]" />
          <SummaryCard title="Pending Amount" value={formatCurrency(summary.pending)} bgColor="bg-[#E11B22]" />
        </div>

        <section className="mb-8 max-w-6xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <h2 className="text-3xl font-extrabold text-black">Recent payments</h2>
            <button
              onClick={() => {
                setEditingPaymentId(null);
                setPaymentForm(emptyPaymentForm);
                setPaymentModalOpen(true);
              }}
              className="self-start md:self-auto bg-[#5B2377] hover:bg-[#4A1D52] text-white rounded-full px-7 py-3 text-xl leading-tight shadow-sm"
            >
              + Add New Payment
            </button>
          </div>

          <DataTable
            headers={['Receipt No.', 'Student Name', 'Amount Paid', 'Date', 'Receipt', 'Action']}
            emptyText={loading ? 'Loading payments...' : 'No payments found'}
            rows={recentPayments.map((payment) => [
              payment.receiptNo || '-',
              payment.studentName || '-',
              formatCurrency(payment.amount),
              payment.date ? new Date(payment.date).toLocaleString('default', { month: 'long' }) : '-',
              <button
                key={`receipt-${payment.id}`}
                onClick={() => {
                  setSelectedReceipt(payment);
                  setReceiptModalOpen(true);
                }}
                className="inline-flex items-center justify-center rounded-full bg-[#5B2377] px-4 py-2 text-white text-sm hover:bg-[#4A1D52]"
              >
                View
              </button>,
              <ActionButtons
                key={`action-${payment.id}`}
                onEdit={() => handleEditPayment(payment)}
                onDelete={() => handleDeletePayment(payment.id)}
              />,
            ])}
          />
        </section>

        <section className="max-w-6xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <h2 className="text-3xl font-extrabold text-black">Pending payments</h2>
            <button
              onClick={() => {
                setEditingPendingId(null);
                setPendingForm(emptyPendingForm);
                setPendingModalOpen(true);
              }}
              className="self-start md:self-auto bg-[#5B2377] hover:bg-[#4A1D52] text-white rounded-full px-7 py-3 text-xl leading-tight shadow-sm"
            >
              + Add Pending Payment
            </button>
          </div>

          <DataTable
            headers={['Student ID', 'Student Name', 'Due Amount', 'Due Date', 'Status', 'Action']}
            emptyText={loading ? 'Loading pending payments...' : 'No pending payments found'}
            rows={recentPending.map((pending) => [
              pending.studentId || '-',
              pending.studentName || '-',
              formatCurrency(pending.dueAmount),
              formatDateForDisplay(pending.dueDate),
              <button
                key={`status-${pending.id}`}
                onClick={() => handleMarkAsPaid(pending)}
                className="rounded-full border border-[#5B2377] px-4 py-2 text-sm font-medium text-[#5B2377] hover:bg-[#5B2377] hover:text-white"
              >
                Mark Paid
              </button>,
              <ActionButtons
                key={`pending-action-${pending.id}`}
                onEdit={() => handleEditPending(pending)}
                onDelete={() => handleDeletePending(pending.id)}
              />,
            ])}
          />
        </section>
      </div>

      <div className="bg-[#D9D6D6] text-center py-4 text-gray-500 text-sm mt-auto">
        @2026 Roots Education Center. All right reserved.
      </div>

      {paymentModalOpen && (
        <PaymentModal
          title={editingPaymentId ? 'Edit Payment' : 'Add New Payment'}
          formData={paymentForm}
          onChange={handlePaymentInputChange}
          onClose={resetPaymentModal}
          onSubmit={handleSavePayment}
          submitLabel={editingPaymentId ? 'Update' : 'Add'}
        />
      )}

      {pendingModalOpen && (
        <PendingPaymentModal
          title={editingPendingId ? 'Edit Pending Payment' : 'Add New Pending Payment'}
          formData={pendingForm}
          onChange={handlePendingInputChange}
          onClose={resetPendingModal}
          onSubmit={handleSavePending}
          submitLabel={editingPendingId ? 'Update' : 'Add'}
        />
      )}

      {receiptModalOpen && selectedReceipt && (
        <ReceiptModal
          payment={selectedReceipt}
          onClose={() => {
            setReceiptModalOpen(false);
            setSelectedReceipt(null);
          }}
        />
      )}
    </div>
  );
};

const SummaryCard = ({ title, value, bgColor }) => (
  <div className={`${bgColor} rounded-2xl text-white px-8 py-6 shadow-sm min-h-[145px] flex flex-col justify-center`}>
    <h3 className="text-2xl md:text-[28px] font-light mb-7">{title}</h3>
    <p className="text-3xl md:text-[30px] font-normal">{value}</p>
  </div>
);

const DataTable = ({ headers, rows, emptyText }) => (
  <div className="bg-[#E8E5E5] border border-gray-300 overflow-hidden shadow-sm">
    <table className="w-full text-left">
      <thead>
        <tr className="bg-[#CFC9C9] text-black text-base font-bold">
          {headers.map((header) => (
            <th key={header} className="px-6 py-4">
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr>
            <td colSpan={headers.length} className="px-6 py-12 text-center text-gray-500">
              {emptyText}
            </td>
          </tr>
        ) : (
          rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="border-t border-gray-400 text-[18px] text-gray-900">
              {row.map((cell, cellIndex) => (
                <td key={`${rowIndex}-${cellIndex}`} className="px-6 py-4 align-middle">
                  {cell}
                </td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </table>
    <div className="flex justify-center py-4">
      <button className="bg-[#5B2377] hover:bg-[#4A1D52] text-white rounded-full px-12 py-3 text-xl shadow-sm">
        View All
      </button>
    </div>
  </div>
);

const ActionButtons = ({ onEdit, onDelete }) => (
  <div className="flex items-center gap-3 text-gray-600">
    <button onClick={onEdit} className="hover:text-[#5B2377]" title="Edit">
      <Pencil size={22} />
    </button>
    <button onClick={onDelete} className="hover:text-red-600" title="Delete">
      <Trash2 size={22} />
    </button>
  </div>
);

const FormShell = ({ title, children, onClose, onSubmit, submitLabel }) => (
  <div className="fixed inset-0 bg-[#4A1D52]/95 flex items-center justify-center px-4 z-50">
    <div className="bg-[#F1EEEE] rounded-[34px] p-10 w-full max-w-2xl relative shadow-2xl">
      <button onClick={onClose} className="absolute right-5 top-5 text-gray-500 hover:text-black">
        <X size={24} />
      </button>
      <h2 className="text-center text-4xl font-serif font-semibold text-black mb-10">{title}</h2>
      <form onSubmit={onSubmit}>
        <div className="space-y-5">{children}</div>
        <div className="flex justify-between gap-4 mt-10">
          <button
            type="button"
            onClick={onClose}
            className="border border-gray-600 rounded-full px-12 py-3 text-2xl min-w-[180px] bg-white"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-[#5B2377] hover:bg-[#4A1D52] text-white rounded-full px-12 py-3 text-2xl min-w-[180px]"
          >
            {submitLabel}
          </button>
        </div>
      </form>
    </div>
  </div>
);

const FormField = ({ label, name, value, onChange, type = 'text', placeholder = '', required = true }) => (
  <div>
    <label className="block text-[20px] font-serif font-semibold text-black mb-2">{label}</label>
    <div className="relative">
      <input
        required={required}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full h-14 rounded-full border border-gray-400 bg-[#F7F5F5] px-6 pr-14 text-lg outline-none"
      />
      {type === 'date' && <CalendarDays size={22} className="absolute right-5 top-4 text-gray-600 pointer-events-none" />}
    </div>
  </div>
);

const PaymentModal = ({ title, formData, onChange, onClose, onSubmit, submitLabel }) => (
  <FormShell title={title} onClose={onClose} onSubmit={onSubmit} submitLabel={submitLabel}>
    <FormField label="Receipt No" name="receiptNo" value={formData.receiptNo} onChange={onChange} />
    <FormField label="Student ID" name="studentId" value={formData.studentId} onChange={onChange} />
    <FormField label="Student Name" name="studentName" value={formData.studentName} onChange={onChange} />
    <FormField label="Amount Paid" name="amount" type="number" value={formData.amount} onChange={onChange} />
    <FormField label="Date" name="date" type="date" value={formData.date} onChange={onChange} />
  </FormShell>
);

const PendingPaymentModal = ({ title, formData, onChange, onClose, onSubmit, submitLabel }) => (
  <FormShell title={title} onClose={onClose} onSubmit={onSubmit} submitLabel={submitLabel}>
    <FormField label="Student Id" name="studentId" value={formData.studentId} onChange={onChange} />
    <FormField label="Student Name" name="studentName" value={formData.studentName} onChange={onChange} />
    <FormField label="Due Amount" name="dueAmount" type="number" value={formData.dueAmount} onChange={onChange} />
    <FormField label="Due Date" name="dueDate" type="date" value={formData.dueDate} onChange={onChange} />
  </FormShell>
);

const ReceiptModal = ({ payment, onClose }) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center px-4 z-50">
    <div className="bg-white rounded-3xl w-full max-w-lg p-8 shadow-2xl relative">
      <button onClick={onClose} className="absolute right-5 top-5 text-gray-500 hover:text-black">
        <X size={24} />
      </button>
      <div className="flex items-center justify-center gap-3 mb-6 text-[#5B2377]">
        <ReceiptText size={30} />
        <h2 className="text-3xl font-bold">Payment Receipt</h2>
      </div>
      <div className="rounded-2xl border border-gray-200 bg-[#F8F8F8] p-6 space-y-4 text-lg">
        <ReceiptRow label="Receipt No" value={payment.receiptNo || '-'} />
        <ReceiptRow label="Student ID" value={payment.studentId || '-'} />
        <ReceiptRow label="Student Name" value={payment.studentName || '-'} />
        <ReceiptRow label="Amount Paid" value={formatCurrency(payment.amount)} />
        <ReceiptRow label="Date" value={formatDateForDisplay(payment.date)} />
        <ReceiptRow label="Status" value={payment.status || 'Completed'} />
      </div>
      <div className="flex justify-center mt-8">
        <button
          onClick={() => window.print()}
          className="bg-[#5B2377] hover:bg-[#4A1D52] text-white rounded-full px-10 py-3 text-lg"
        >
          Print Receipt
        </button>
      </div>
    </div>
  </div>
);

const ReceiptRow = ({ label, value }) => (
  <div className="flex justify-between gap-4 border-b border-gray-200 pb-3 last:border-0 last:pb-0">
    <span className="font-semibold text-gray-700">{label}</span>
    <span className="text-right text-gray-900">{value}</span>
  </div>
);

export default FeesDashboard;
