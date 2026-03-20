import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ClaimProvider } from './context/ClaimContext';
import { MainLayout } from './components/MainLayout';
import { RequireAuth, AdminRoute } from './components/RequireAuth';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { ClaimsDashboard } from './pages/ClaimsDashboard';
import { ClaimDetails } from './pages/ClaimDetails';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminClaimDetails } from './pages/AdminClaimDetails';

export default function App() {
  return (
    <AuthProvider>
      <ClaimProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<RequireAuth />}>
              <Route element={<MainLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/claims" element={<ClaimsDashboard />} />
                <Route path="/claims/:id" element={<ClaimDetails />} />
                <Route
                  path="/admin"
                  element={
                    <AdminRoute>
                      <AdminDashboard />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/:id"
                  element={
                    <AdminRoute>
                      <AdminClaimDetails />
                    </AdminRoute>
                  }
                />
              </Route>
            </Route>
          </Routes>
        </Router>
      </ClaimProvider>
    </AuthProvider>
  );
}
