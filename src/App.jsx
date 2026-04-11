import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { QueryClient, QueryClientProvider } from 'react-query';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ResumeProvider } from './contexts/ResumeContext';
import PrivateRoute from './components/auth/PrivateRoute';
import AdminRoute from './components/auth/AdminRoute';

// Layouts
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import Builder from './pages/Builder';
import Templates from './pages/Templates';
import ATSScannerPage from './pages/ATSScannerPage';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Admin from './pages/Admin';
import Pricing from './pages/Pricing';
import About from './pages/About';
import Contact from './pages/Contact';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import NotFound from './pages/NotFound';

import './styles/globals.css';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <ThemeProvider>
          <AuthProvider>
            <NotificationProvider>
              <ResumeProvider>
                <DndProvider backend={HTML5Backend}>
                  <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                    <Routes>
                      {/* Public Routes */}
                      <Route path="/" element={<MainLayout><Home /></MainLayout>} />
                      <Route path="/pricing" element={<MainLayout><Pricing /></MainLayout>} />
                      <Route path="/about" element={<MainLayout><About /></MainLayout>} />
                      <Route path="/contact" element={<MainLayout><Contact /></MainLayout>} />
                      <Route path="/privacy" element={<MainLayout><Privacy /></MainLayout>} />
                      <Route path="/terms" element={<MainLayout><Terms /></MainLayout>} />
                      
                      {/* Auth Routes */}
                      <Route path="/login" element={<AuthLayout><Login /></AuthLayout>} />
                      <Route path="/signup" element={<AuthLayout><SignUp /></AuthLayout>} />
                      <Route path="/forgot-password" element={<AuthLayout><ForgotPassword /></AuthLayout>} />
                      
                      {/* Protected Routes */}
                      <Route path="/dashboard" element={
                        <PrivateRoute>
                          <DashboardLayout><Dashboard /></DashboardLayout>
                        </PrivateRoute>
                      } />
                      <Route path="/builder/:id?" element={
                        <PrivateRoute>
                          <DashboardLayout><Builder /></DashboardLayout>
                        </PrivateRoute>
                      } />
                      <Route path="/templates" element={
                        <PrivateRoute>
                          <DashboardLayout><Templates /></DashboardLayout>
                        </PrivateRoute>
                      } />
                      <Route path="/ats-scanner" element={
                        <PrivateRoute>
                          <DashboardLayout><ATSScannerPage /></DashboardLayout>
                        </PrivateRoute>
                      } />
                      <Route path="/profile" element={
                        <PrivateRoute>
                          <DashboardLayout><Profile /></DashboardLayout>
                        </PrivateRoute>
                      } />
                      <Route path="/settings" element={
                        <PrivateRoute>
                          <DashboardLayout><Settings /></DashboardLayout>
                        </PrivateRoute>
                      } />
                      
                      {/* Admin Routes */}
                      <Route path="/admin/*" element={
                        <AdminRoute>
                          <DashboardLayout><Admin /></DashboardLayout>
                        </AdminRoute>
                      } />
                      
                      {/* 404 */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                    
                    <Toaster 
                      position="top-right"
                      toastOptions={{
                        className: 'glass',
                        duration: 4000,
                      }}
                    />
                  </div>
                </DndProvider>
              </ResumeProvider>
            </NotificationProvider>
          </AuthProvider>
        </ThemeProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;