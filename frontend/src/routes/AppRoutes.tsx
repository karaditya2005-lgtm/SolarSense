import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { PublicLayout } from '../components/layout/PublicLayout.tsx';
import { Home } from '../pages/public/Home.tsx';
import { About } from '../pages/public/About.tsx';
import { Features } from '../pages/public/Features.tsx';
import { HowItWorks } from '../pages/public/HowItWorks.tsx';
import { Contact } from '../pages/public/Contact.tsx';
import { Login } from '../pages/public/Login.tsx';
import { Register } from '../pages/public/Register.tsx';
import { NotFound } from '../pages/public/NotFound.tsx';
import { Dashboard } from '../pages/app/Dashboard.tsx';
import { Analytics } from '../pages/app/Analytics.tsx';
import { AdminDashboard } from '../pages/admin/AdminDashboard.tsx';
import { AdminLogin } from '../pages/admin/AdminLogin.tsx';
import { ProtectedRoute } from './ProtectedRoute.tsx';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Pages with Header/Footer layout */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/features" element={<Features />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/404" element={<NotFound />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      {/* Split-Screen Auth Pages (no standard header/footer) */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Authenticated Application Pages */}
      <Route
        path="/app"
        element={<Navigate to="/app/dashboard" replace />}
      />
      <Route
        path="/app/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/analytics"
        element={
          <ProtectedRoute>
            <Analytics />
          </ProtectedRoute>
        }
      />

      {/* Admin Authentication & Console Routes */}
      <Route path="/admin" element={<AdminLogin />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute requireAdmin>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};


