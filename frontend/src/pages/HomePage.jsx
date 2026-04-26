import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../config';
import { getRecentActivities, getTimeAgo } from '../utils/activityLogger';

export default function HomePage() {
  const navigate = useNavigate();

  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [staff, setStaff] = useState([]);
  const [courses, setCourses] = useState([]);
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    fetchDashboardData();
    loadRecentActivities();

    const interval = setInterval(() => {
      loadRecentActivities();
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [studentsRes, teachersRes, staffRes, coursesRes] = await Promise.all([
        fetch(`${API_BASE}/api/students`),
        fetch(`${API_BASE}/api/teachers`),
        fetch(`${API_BASE}/api/staff`),
        fetch(`${API_BASE}/api/courses`),
      ]);

      const studentsData = await studentsRes.json();
      const teachersData = await teachersRes.json();
      const staffData = await staffRes.json();
      const coursesData = await coursesRes.json();

      setStudents(Array.isArray(studentsData) ? studentsData : []);
      setTeachers(Array.isArray(teachersData) ? teachersData : []);
      setStaff(Array.isArray(staffData) ? staffData : []);
      setCourses(Array.isArray(coursesData) ? coursesData : []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const loadRecentActivities = () => {
    try {
      const savedActivities = getRecentActivities();
      setActivities(Array.isArray(savedActivities) ? savedActivities.slice(0, 5) : []);
    } catch (error) {
      console.error('Error loading activities:', error);
      setActivities([]);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-white overflow-y-auto">
      <div className="px-8 py-6 bg-white min-h-full">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Roots Institute Management System
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 mb-8">
          <div
            onClick={() => navigate('/students')}
            className="rounded-[20px] p-6 text-white shadow-md bg-gradient-to-r from-blue-600 to-blue-500 cursor-pointer hover:-translate-y-1 transition-transform"
          >
            <h2 className="text-xl font-bold mb-2">Student Management</h2>
            <p className="text-base text-white/90">Admissions, profiles and status updates</p>
          </div>

          <div
            onClick={() => navigate('/teachers-staff')}
            className="rounded-[20px] p-6 text-white shadow-md bg-gradient-to-r from-purple-700 to-fuchsia-500 cursor-pointer hover:-translate-y-1 transition-transform"
          >
            <h2 className="text-xl font-bold mb-2">Teachers & Staff</h2>
            <p className="text-base text-white/90">Manage teachers and staff details</p>
          </div>

          <div
            onClick={() => navigate('/courses')}
            className="rounded-[20px] p-6 text-white shadow-md bg-gradient-to-r from-green-500 to-lime-500 cursor-pointer hover:-translate-y-1 transition-transform"
          >
            <h2 className="text-xl font-bold mb-2">Course Management</h2>
            <p className="text-base text-white/90">Course details and schedules</p>
          </div>

          <div
            onClick={() => navigate('/attendance')}
            className="rounded-[20px] p-6 text-white shadow-md bg-gradient-to-r from-orange-600 to-orange-500 cursor-pointer hover:-translate-y-1 transition-transform"
          >
            <h2 className="text-xl font-bold mb-2">Attendance</h2>
            <p className="text-base text-white/90">Daily attendance and summaries</p>
          </div>

          <div
            onClick={() => navigate('/exams')}
            className="rounded-[20px] p-6 text-white shadow-md bg-gradient-to-r from-pink-600 to-fuchsia-500 cursor-pointer hover:-translate-y-1 transition-transform"
          >
            <h2 className="text-xl font-bold mb-2">Exams & Results</h2>
            <p className="text-base text-white/90">Marks, grades and performance</p>
          </div>

          <div
            onClick={() => navigate('/fees')}
            className="rounded-[20px] p-6 text-white shadow-md bg-gradient-to-r from-red-600 to-red-500 cursor-pointer hover:-translate-y-1 transition-transform"
          >
            <h2 className="text-xl font-bold mb-2">Fees & Payments</h2>
            <p className="text-base text-white/90">Payments, pending dues and receipts</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
          <div className="bg-[#4B1D63] rounded-2xl p-5 text-white shadow-md">
            <h3 className="text-lg font-medium mb-2 text-white/80">Total Students</h3>
            <p className="text-4xl font-bold">{students.length}</p>
          </div>

          <div className="bg-[#4B1D63] rounded-2xl p-5 text-white shadow-md">
            <h3 className="text-lg font-medium mb-2 text-white/80">Total Teachers</h3>
            <p className="text-4xl font-bold">{teachers.length}</p>
          </div>

          <div className="bg-[#4B1D63] rounded-2xl p-5 text-white shadow-md">
            <h3 className="text-lg font-medium mb-2 text-white/80">Staff Members</h3>
            <p className="text-4xl font-bold">{staff.length}</p>
          </div>

          <div className="bg-[#4B1D63] rounded-2xl p-5 text-white shadow-md">
            <h3 className="text-lg font-medium mb-2 text-white/80">Active Courses</h3>
            <p className="text-4xl font-bold">{courses.length}</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="py-4 text-center border-b border-gray-200 bg-gray-50">
            <h2 className="text-xl font-semibold text-gray-700">Recent Activity</h2>
          </div>

          {activities.length > 0 ? (
            activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-4 px-6 py-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors"
              >
                <div className="text-blue-500 text-lg mt-0.5">●</div>
                <div>
                  <p className="text-base text-gray-700">{activity.message}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {getTimeAgo(activity.createdAt)}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-8 text-center text-gray-500">
              No recent activity found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}