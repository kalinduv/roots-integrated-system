import React, { useEffect, useMemo, useState } from 'react';
import { API_BASE } from '../config';
import {
  UserCog,
  Users,
  BarChart3,
  Search,
  Pencil,
  Trash2,
  CalendarDays,
  Mail,
  Phone,
  ShieldCheck,
  UserRound,
} from 'lucide-react';

const initialForm = {
  fullName: '',
  phone: '',
  email: '',
  date: '',
  role: 'Staff',
};

const cardIcons = {
  'Total Users': <UserCog size={28} />,
  'Staff Members': <Users size={28} />,
  'Active Roles': <ShieldCheck size={28} />,
  'Attendance Rate': <BarChart3 size={28} />,
};

const roleColors = {
  Admin: '#A855F7',
  Staff: '#4A1D52',
  Lecturer: '#7C3AED',
};

const StatCard = ({ label, value, growth }) => (
  <div className="bg-primary text-white rounded-2xl px-6 py-5 min-h-[118px] shadow-sm flex flex-col justify-between">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-[15px] tracking-wide">{label}</p>
        <h3 className="text-4xl leading-tight mt-2">{value}</h3>
      </div>
      <div className="bg-white text-primary p-2 rounded-md">{cardIcons[label]}</div>
    </div>
    <p className="text-[#43FF43] text-[14px] font-semibold">+{growth}%</p>
  </div>
);

const PieChartCard = ({ users }) => {
  const counts = useMemo(() => {
    const map = { Admin: 0, Staff: 0, Lecturer: 0 };
    users.forEach((user) => {
      map[user.role] = (map[user.role] || 0) + 1;
    });
    return map;
  }, [users]);

  const total = Object.values(counts).reduce((sum, value) => sum + value, 0) || 1;
  const segments = Object.entries(counts);
  let currentAngle = 0;

  const paths = segments.map(([role, count]) => {
    const angle = (count / total) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;

    const polarToCartesian = (angleInDegrees) => {
      const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
      return {
        x: 120 + 85 * Math.cos(angleInRadians),
        y: 120 + 85 * Math.sin(angleInRadians),
      };
    };

    if (count === 0) return null;

    const start = polarToCartesian(endAngle);
    const end = polarToCartesian(startAngle);
    const largeArcFlag = angle > 180 ? 1 : 0;

    const d = [
      'M', 120, 120,
      'L', start.x, start.y,
      'A', 85, 85, 0, largeArcFlag, 0, end.x, end.y,
      'Z',
    ].join(' ');

    return <path key={role} d={d} fill={roleColors[role]} stroke="#ffffff" strokeWidth="2" />;
  });

  return (
    <div className="bg-[#F1E9EA] border border-gray-500 rounded-xl p-5 min-h-[390px]">
      <h3 className="text-center text-[17px] font-medium mb-6">User Distribution by Role</h3>
      <div className="bg-white h-[250px] rounded-sm flex items-center justify-center border border-gray-100">
        <svg width="310" height="250" viewBox="0 0 240 240" aria-label="User role pie chart">
          {paths}
        </svg>
      </div>
      <div className="mt-5 flex items-center justify-center gap-6 flex-wrap text-sm">
        {segments.map(([role, count]) => {
          const percentage = Math.round((count / total) * 100) || 0;
          return (
            <div key={role} className="flex items-center gap-2">
              <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: roleColors[role] }} />
              <span>{role} {percentage}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const RecentActivityCard = ({ activities }) => (
  <div className="bg-[#F1E9EA] border border-gray-500 rounded-xl min-h-[390px] overflow-hidden">
    <h3 className="text-center text-[17px] font-medium py-5">Recent Activity</h3>
    <div className="divide-y divide-gray-500">
      {activities.map((activity) => (
        <div key={activity.id} className="px-6 py-5 flex gap-4 items-start">
          <span className="text-gray-400 text-xl mt-1">★</span>
          <div>
            <p className="text-[16px] text-gray-900">{activity.message}</p>
            <p className="text-gray-500 mt-1">{activity.time}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const UserModal = ({ isOpen, mode, formData, onChange, onClose, onSubmit }) => {
  if (!isOpen) return null;

  const currentRole = formData.role === 'Admin' ? 'Admin' : 'Staff';

  return (
    <div className="fixed inset-0 bg-primary z-50 overflow-auto">
      <div className="min-h-screen flex items-center justify-center px-6 py-12 md:px-10">
        <div className="w-full max-w-4xl bg-[#F4F0F1] rounded-[32px] px-8 py-10 md:px-14 md:py-12 shadow-lg">
          <h2 className="text-center text-[32px] md:text-[38px] font-bold mb-10 font-serif">
            {mode === 'edit' ? `Edit ${currentRole}` : `Add New ${currentRole}`}
          </h2>
          <form onSubmit={onSubmit} className="max-w-3xl mx-auto space-y-6">
            <div>
              <label className="block text-[18px] font-semibold mb-3 font-serif">Full Name</label>
              <input name="fullName" value={formData.fullName} onChange={onChange} required className="modal-input" />
            </div>
            <div>
              <label className="block text-[18px] font-semibold mb-3 font-serif">Phone Number</label>
              <input name="phone" value={formData.phone} onChange={onChange} required className="modal-input" />
            </div>
            <div>
              <label className="block text-[18px] font-semibold mb-3 font-serif">E-mail</label>
              <input name="email" type="email" value={formData.email} onChange={onChange} required className="modal-input" />
            </div>
            <div>
              <label className="block text-[18px] font-semibold mb-3 font-serif">Date</label>
              <div className="relative">
                <input name="date" type="date" value={formData.date} onChange={onChange} required className="modal-input pr-12" />
                <CalendarDays size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-700 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-[18px] font-semibold mb-3 font-serif">Role</label>
              <input name="role" value={formData.role} onChange={onChange} required className="modal-input" readOnly />
            </div>
            <div className="flex flex-col md:flex-row items-center justify-between pt-8 gap-5">
              <button type="button" onClick={onClose} className="w-full border border-black text-black rounded-full py-3.5 text-[18px] bg-white">
                Cancel
              </button>
              <button type="submit" className="w-full bg-primary text-white rounded-full py-3.5 text-[18px]">
                {mode === 'edit' ? 'Update' : 'Add'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const UserManagementDashboard = () => {
  const [users, setUsers] = useState([]);
  const [dashboard, setDashboard] = useState({
    totalUsers: 0,
    totalStaff: 0,
    activeRoles: 0,
    attendanceRate: 0,
  });
  const [activities, setActivities] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedRole, setSelectedRole] = useState('Staff');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    fetchUsers();
    fetchDashboard();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/users`);
      const data = await response.json();
      setUsers(data);
      setErrorMessage('');
    } catch (error) {
      console.error('Error fetching users:', error);
      setErrorMessage('Unable to load users. Make sure the backend is running.');
    }
  };

  const fetchDashboard = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/users/dashboard/summary`);
      const data = await response.json();
      setDashboard(data.summary);
      setActivities(data.activities);
    } catch (error) {
      console.error('Error fetching dashboard summary:', error);
    }
  };

  const openCreateModal = (role) => {
    setModalMode('create');
    setEditingId(null);
    setFormData({ ...initialForm, role, date: new Date().toISOString().split('T')[0] });
    setIsModalOpen(true);
  };

  const handleInputChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const method = editingId ? 'PUT' : 'POST';
    const url = editingId
      ? `${API_BASE}/api/users/${editingId}`
      : `${API_BASE}/api/users`;

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, active: true }),
      });

      if (response.ok) {
        await fetchUsers();
        await fetchDashboard();
        closeModal();
        setSelectedRole(formData.role);
      }
    } catch (error) {
      console.error('Error saving user:', error);
    }
  };

  const handleEdit = (user) => {
    setModalMode('edit');
    setEditingId(user.id);
    setFormData({
      fullName: user.fullName,
      phone: user.phone,
      email: user.email,
      date: user.date,
      role: user.role,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to remove this user?')) return;

    try {
      const response = await fetch(`${API_BASE}/api/users/${userId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        await fetchUsers();
        await fetchDashboard();
      }
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      const response = await fetch(`${API_BASE}/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !currentStatus }),
      });
      if (response.ok) {
        await fetchUsers();
        await fetchDashboard();
      }
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData(initialForm);
  };

  const roleUsers = users.filter((user) => user.role === selectedRole);
  const filteredUsers = roleUsers.filter((user) => {
    const term = searchTerm.toLowerCase();
    return (
      user.fullName.toLowerCase().includes(term) ||
      user.email.toLowerCase().includes(term) ||
      user.role.toLowerCase().includes(term) ||
      user.id.toLowerCase().includes(term)
    );
  });

  const addButtonLabel = selectedRole === 'Admin' ? '+ Add Admin' : '+ Add Staff';

  return (
    <div className="flex-1 flex flex-col bg-secondary overflow-hidden">
      <div className="bg-[#E6E6E6] px-10 py-3 border-b border-gray-300">
        <h2 className="text-xs font-bold text-gray-500 tracking-widest uppercase">Dashboard</h2>
      </div>

      <div className="px-8 md:px-10 py-8 flex-1 overflow-auto">
        <h1 className="text-4xl font-bold mb-8 text-gray-900">Dashboard</h1>

        <div className="grid xl:grid-cols-4 md:grid-cols-2 gap-6 mb-10">
          <StatCard label="Total Users" value={dashboard.totalUsers} growth={12} />
          <StatCard label="Staff Members" value={dashboard.totalStaff} growth={9} />
          <StatCard label="Active Roles" value={dashboard.activeRoles} growth={5} />
          <StatCard label="Attendance Rate" value={dashboard.attendanceRate} growth={4} />
        </div>

        <div className="grid lg:grid-cols-2 gap-10 mb-10">
          <PieChartCard users={users} />
          <RecentActivityCard activities={activities} />
        </div>

        {errorMessage && (
          <div className="mb-6 max-w-3xl mx-auto bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-xl">
            {errorMessage}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-center gap-14 mb-10">
          <button
            onClick={() => setSelectedRole('Staff')}
            className={`role-button ${selectedRole === 'Staff' ? 'bg-primary' : 'bg-primary/85'}`}
          >
            Staff
          </button>
          <button
            onClick={() => setSelectedRole('Admin')}
            className={`role-button ${selectedRole === 'Admin' ? 'bg-[#A346E4]' : 'bg-[#A346E4]/85'}`}
          >
            Admin
          </button>
        </div>

        <div className="mb-8 relative max-w-3xl mx-auto">
          <input
            type="text"
            placeholder={`Search ${selectedRole.toLowerCase()}...`}
            className="w-full pl-12 pr-4 py-3 rounded-full border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="w-5 h-5 text-gray-400 absolute left-4 top-3.5" />
        </div>

        <div className="bg-white border border-gray-300 shadow-sm overflow-hidden mb-10">
          <table className="w-full">
            <thead>
              <tr className="bg-stone-300 text-gray-900 text-left text-sm font-semibold border-b border-gray-400">
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Contact Number</th>
                <th className="px-6 py-4">E-mail</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-300 bg-[#D9D9D9]">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="text-sm align-top">
                  <td className="px-6 py-4 min-w-[230px]">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 bg-white rounded-full flex items-center justify-center text-primary border border-gray-300">
                        <UserRound size={20} />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{user.fullName}</div>
                        <div className="text-gray-500">{user.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-800 min-w-[180px]">
                    <div className="flex items-center gap-2"><Phone size={15} /> {user.phone}</div>
                  </td>
                  <td className="px-6 py-4 text-gray-800 min-w-[220px]">
                    <div className="flex items-center gap-2"><Mail size={15} /> {user.email}</div>
                  </td>
                  <td className="px-6 py-4 text-gray-800 min-w-[130px]">{user.role}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleToggleStatus(user.id, user.active)}
                      className={`relative inline-block w-12 h-6 rounded-full cursor-pointer transition-colors ${user.active ? 'bg-gray-700' : 'bg-gray-400'}`}
                    >
                      <span className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${user.active ? 'transform translate-x-6' : ''}`}></span>
                    </button>
                  </td>
                  <td className="px-6 py-4 text-gray-700 min-w-[120px]">
                    <button onClick={() => handleEdit(user)} className="mr-4 hover:text-black"><Pencil size={18} /></button>
                    <button onClick={() => handleDelete(user.id)} className="hover:text-red-600"><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredUsers.length === 0 && <div className="text-center py-10 text-gray-500 bg-[#D9D9D9]">No {selectedRole.toLowerCase()} users found</div>}
        </div>

        <div className="flex flex-col items-center gap-6 pb-8">
          <button className="bg-primary text-white px-10 py-2 rounded-full min-w-[180px]">View All</button>
          <button
            onClick={() => openCreateModal(selectedRole)}
            className="bg-primary text-white px-12 py-3 rounded-full text-[16px] min-w-[290px] font-medium"
          >
            {addButtonLabel}
          </button>
        </div>
      </div>

      <div className="bg-[#dedede] text-center py-4 text-gray-500 text-sm mt-auto">
        @2026 Roots Education Center. All right reserved
      </div>

      <UserModal
        isOpen={isModalOpen}
        mode={modalMode}
        formData={formData}
        onChange={handleInputChange}
        onClose={closeModal}
        onSubmit={handleSubmit}
      />
    </div>
  );
};

export default UserManagementDashboard;
