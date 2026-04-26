import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  GraduationCap, 
  Users, 
  BookOpen, 
  Calendar, 
  FileText, 
  DollarSign, 
  LogOut,
  Menu
} from 'lucide-react';

export default function Sidebar() {
  const navigate = useNavigate();

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Students', path: '/students', icon: GraduationCap },
    { name: 'Teachers and Staff', path: '/teachers-staff', icon: Users },
    { name: 'Courses', path: '/courses', icon: BookOpen },
    { name: 'Attendance', path: '/attendance', icon: Calendar },
    { name: 'Exams & Results', path: '/exams', icon: FileText },
    { name: 'Fees', path: '/fees', icon: DollarSign },
  ];

  const handleLogout = () => {
    localStorage.removeItem('rootsAuth');
    navigate('/login', { replace: true });
  };

  return (
    <aside className="w-[240px] bg-[#4A1D52] text-white flex flex-col justify-between h-screen overflow-y-auto shrink-0 custom-scrollbar">
      <div>
        {/* Removed menu bar button from top left corner */}
        <div className="flex justify-center items-center pb-8 pt-2">
          <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center overflow-hidden shadow-md border-2 border-white/10">
            <img src="/logo.jpeg" alt="Roots Logo" className="w-full h-full object-cover" />
          </div>
        </div>

        <nav className="mt-2 flex flex-col gap-1 pb-4">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-6 py-3 text-[15px] transition-colors ${
                  isActive ? 'bg-[#3A1740] font-semibold border-l-4 border-white' : 'hover:bg-[#3A1740] border-l-4 border-transparent'
                }`
              }
            >
              <item.icon size={20} />
              {item.name}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="p-5 mt-auto">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 bg-[#3A1740] hover:bg-[#280E2C] text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  );
}