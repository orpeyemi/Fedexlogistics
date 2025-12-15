import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import TrackingPage from './pages/TrackingPage';
import AdminDashboard from './pages/AdminDashboard';

// Mock Authentication Guard (Simplified for demo)
const AdminRoute = ({ children }: { children?: React.ReactNode }) => {
  // In a real app, check auth state here
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<TrackingPage />} />
        <Route 
          path="/admin" 
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          } 
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
};

export default App;