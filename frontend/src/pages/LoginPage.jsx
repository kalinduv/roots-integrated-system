import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Define valid user credentials
const VALID_USERS = {
  admin: 'rootsadmin123',
  staff: 'rootsstaff123',
  teachers: 'rootsteachers123'
};

export default function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Check if username exists and password is correct
    if (VALID_USERS[form.username] && VALID_USERS[form.username] === form.password) {
      localStorage.setItem(
        'rootsAuth',
        JSON.stringify({ isLoggedIn: true, username: form.username })
      );
      navigate('/dashboard', { replace: true });
      return;
    }

    setError('Invalid username or password.');
  };

  return (
    <div className="min-h-screen bg-[#4A1D52] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-[#f5f3f2] rounded-[32px] shadow-2xl p-8 md:p-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg p-2 overflow-hidden mb-5">
            <img src="/logo.jpeg" alt="Roots Logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-4xl font-bold text-black mb-2">Login</h1>
          <p className="text-gray-600 text-center text-sm">
            Roots Institute Management System
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[15px] font-medium text-gray-800 mb-2">
              Username
            </label>
            <input
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              required
              className="w-full h-12 px-4 rounded-2xl border border-gray-300 bg-white focus:outline-none"
              placeholder="Enter username"
            />
          </div>

          <div>
            <label className="block text-[15px] font-medium text-gray-800 mb-2">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              className="w-full h-12 px-4 rounded-2xl border border-gray-300 bg-white focus:outline-none"
              placeholder="Enter password"
            />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            className="w-full h-12 rounded-full bg-[#4B1D63] text-white text-xl font-medium"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}