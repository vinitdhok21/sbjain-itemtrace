import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import ErrorBoundary from './components/ErrorBoundary';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import NotFoundPage from './pages/NotFoundPage';

import Dashboard from './pages/Dashboard';
import ProfilePage from './pages/ProfilePage';
import MyReportsPage from './pages/MyReportsPage';
import EditReportPage from './pages/EditReportPage';

import ReportLostPage from './pages/ReportLostPage';
import ReportFoundPage from './pages/ReportFoundPage';

import BrowseItemsPage from './pages/BrowseItemsPage';
import ItemDetailsPage from './pages/ItemDetailsPage';

import ConversationsPage from './pages/ConversationsPage';
import ChatPage from './pages/ChatPage';

import NotificationsPage from './pages/NotificationsPage';

import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminReportsPage from './pages/AdminReportsPage';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminActivityPage from './pages/AdminActivityPage';

import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <NotificationProvider>
          <Router>
            <ScrollToTop />
            <div className="flex flex-col min-h-screen bg-slate-50/20">
              {/* NAVBAR */}
              <Navbar />

              {/* MAIN CONTENT */}
              <main className="flex-grow">
                <Routes>
                  {/* PUBLIC ROUTES */}
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  
                  {/* Redirect Legacy Auth Routes */}
                  <Route path="/register" element={<Navigate to="/login" replace />} />
                  <Route path="/forgot-password" element={<Navigate to="/login" replace />} />
                  <Route path="/verify-otp" element={<Navigate to="/login" replace />} />
                  <Route path="/reset-password" element={<Navigate to="/login" replace />} />

                  {/* PROTECTED STUDENT ROUTES */}
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <ProfilePage />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/my-reports"
                    element={
                      <ProtectedRoute>
                        <MyReportsPage />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/edit-report/:id"
                    element={
                      <ProtectedRoute>
                        <EditReportPage />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/report/lost"
                    element={
                      <ProtectedRoute>
                        <ReportLostPage />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/report/found"
                    element={
                      <ProtectedRoute>
                        <ReportFoundPage />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/items"
                    element={
                      <ProtectedRoute>
                        <BrowseItemsPage />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/items/:id"
                    element={
                      <ProtectedRoute>
                        <ItemDetailsPage />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/conversations"
                    element={
                      <ProtectedRoute>
                        <ConversationsPage />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/chat/:conversationId"
                    element={
                      <ProtectedRoute>
                        <ChatPage />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/notifications"
                    element={
                      <ProtectedRoute>
                        <NotificationsPage />
                      </ProtectedRoute>
                    }
                  />

                  {/* PROTECTED ADMIN ROUTES */}
                  <Route
                    path="/admin"
                    element={
                      <AdminRoute>
                        <AdminDashboardPage />
                      </AdminRoute>
                    }
                  />

                  <Route
                    path="/admin/reports"
                    element={
                      <AdminRoute>
                        <AdminReportsPage />
                      </AdminRoute>
                    }
                  />

                  <Route
                    path="/admin/users"
                    element={
                      <AdminRoute>
                        <AdminUsersPage />
                      </AdminRoute>
                    }
                  />

                  <Route
                    path="/admin/activity"
                    element={
                      <AdminRoute>
                        <AdminActivityPage />
                      </AdminRoute>
                    }
                  />

                  {/* 404 NOT FOUND WILDCARD */}
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </main>

              {/* FOOTER */}
              <Footer />
            </div>
          </Router>
        </NotificationProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;