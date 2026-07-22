import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/ProtectedRoute';
import Header from './components/Header';
import Watermark from './components/Watermark';
import ModernLayout from './components/ModernLayout';
import ModernDashboard from './pages/ModernDashboard';
import Courses from './pages/Courses';
import CourseDetail from './pages/CourseDetail';
import CourseCreate from './pages/CourseCreate';
import Assignments from './pages/Assignments';
import AdminDashboard from './pages/AdminDashboard';
import Settings from './pages/Settings';
import About from './pages/About';
import FAQ from './pages/FAQ';
import Attendance from './pages/Attendance';
import Holidays from './pages/Holidays';
import Grades from './pages/Grades';
import Leave from './pages/Leave';
import LeaveApprovals from './pages/LeaveApprovals';
import Feedback from './pages/Feedback';
import Billing from './pages/Billing';
import Messages from './pages/Messages';
import FeeManagement from './pages/FeeManagement';
import Tasks from './pages/Tasks';
import Timetable from './pages/Timetable';
import ResetPassword from './pages/ResetPassword';
import ForgotPassword from './pages/ForgotPassword';
import { useAuth } from './context/AuthContext';

import ActivityTracker from './components/ActivityTracker';
import ActivityTrackerPage from './pages/ActivityTrackerPage';

function DashboardWrapper() {
  const { user } = useAuth();
  const role = String(user?.role || '').toLowerCase();
  if (role === 'teacher' || role === 'admin') {
    return <AdminDashboard />;
  }
  return <ModernDashboard />;
}

export default function App() {
  React.useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  return (
    <>
      <Watermark />
      <ActivityTracker />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot" element={<ForgotPassword />} />
        <Route path="/reset" element={<ResetPassword />} />
        
        {/* Modern Layout Routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <ModernLayout>
              <DashboardWrapper />
            </ModernLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/activity" element={
          <ProtectedRoute>
            <ModernLayout>
              <ActivityTrackerPage />
            </ModernLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/courses" element={
          <ProtectedRoute>
            <ModernLayout>
              <Courses />
            </ModernLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/assignments" element={
          <ProtectedRoute>
            <ModernLayout>
              <Assignments />
            </ModernLayout>
          </ProtectedRoute>
        } />
        <Route path="/calendar" element={
          <ProtectedRoute>
            <ModernLayout>
              <div style={{ padding: '24px' }}>
                <h2>Calendar</h2>
                <p>Calendar view coming soon...</p>
              </div>
            </ModernLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/certificates" element={
          <ProtectedRoute>
            <ModernLayout>
              <div style={{ padding: '24px' }}>
                <h2>Certificates</h2>
                <p>Your certificates will appear here...</p>
              </div>
            </ModernLayout>
          </ProtectedRoute>
        } />
        
        {/* Original Layout Routes */}
        <Route path="/profile" element={
          <ProtectedRoute>
            <ModernLayout>
              <Profile />
            </ModernLayout>
          </ProtectedRoute>
        } />
        <Route
          path="/courses/new"
          element={
            <ProtectedRoute>
              <Header />
              <CourseCreate />
            </ProtectedRoute>
          }
        />
        <Route
          path="/courses/:id"
          element={
            <ProtectedRoute>
              <Header />
              <CourseDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/attendance"
          element={
            <ProtectedRoute>
              <Header />
              <Attendance />
            </ProtectedRoute>
          }
        />
        <Route
          path="/holidays"
          element={
            <ProtectedRoute>
              <Header />
              <Holidays />
            </ProtectedRoute>
          }
        />
        <Route
          path="/grades"
          element={
            <ProtectedRoute>
              <ModernLayout>
                <Grades />
              </ModernLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/leave"
          element={
            <ProtectedRoute>
              <Header />
              <Leave />
            </ProtectedRoute>
          }
        />
        <Route
          path="/leave-approvals"
          element={
            <ProtectedRoute>
              <Header />
              <LeaveApprovals />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Header />
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/feedback"
          element={
            <ProtectedRoute>
              <Header />
              <Feedback />
            </ProtectedRoute>
          }
        />
        <Route
          path="/billing"
          element={
            <ProtectedRoute>
              <Header />
              <Billing />
            </ProtectedRoute>
          }
        />
        <Route
          path="/messages"
          element={
            <ProtectedRoute>
              <Header />
              <Messages />
            </ProtectedRoute>
          }
        />
        <Route
          path="/fee-management"
          element={
            <ProtectedRoute>
              <Header />
              <FeeManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tasks"
          element={
            <ProtectedRoute>
              <Header />
              <Tasks />
            </ProtectedRoute>
          }
        />
        <Route path="/about" element={<About />} />
        <Route path="/faq" element={<FAQ />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <ModernLayout>
                <AdminDashboard />
              </ModernLayout>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}
