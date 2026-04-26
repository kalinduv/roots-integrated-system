import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import StudentsPage from './pages/StudentsPage';
import TeachersStaffPage from './pages/TeachersStaffPage';
import CoursesPage from './pages/CoursesPage';
import AttendancePage from './pages/AttendancePage';
import ExamsPage from './pages/ExamsPage';
import FeesPage from './pages/FeesPage';

import Sidebar from './components/Sidebar';
import Footer from './components/Footer';

function ProtectedLayout({ children }) {
  const auth = JSON.parse(localStorage.getItem('rootsAuth') || '{}');

  if (!auth.isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="layout min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen bg-white">
        <div className="flex-1 overflow-auto">
          {children}
        </div>
        <Footer />
      </div>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const auth = JSON.parse(localStorage.getItem('rootsAuth') || '{}');

  if (!auth.isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedLayout>
              <HomePage />
            </ProtectedLayout>
          }
        />

        <Route
          path="/students"
          element={
            <ProtectedLayout>
              <StudentsPage />
            </ProtectedLayout>
          }
        />

        <Route
          path="/teachers-staff"
          element={
            <ProtectedLayout>
              <TeachersStaffPage />
            </ProtectedLayout>
          }
        />

        <Route
          path="/courses"
          element={
            <ProtectedLayout>
              <CoursesPage />
            </ProtectedLayout>
          }
        />

        <Route
          path="/attendance"
          element={
            <ProtectedLayout>
              <AttendancePage />
            </ProtectedLayout>
          }
        />

        <Route
          path="/exams"
          element={
            <ProtectedLayout>
              <ExamsPage />
            </ProtectedLayout>
          }
        />

        <Route
          path="/fees"
          element={
            <ProtectedLayout>
              <FeesPage />
            </ProtectedLayout>
          }
        />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Navigate to="/dashboard" replace />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}