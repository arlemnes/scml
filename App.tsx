
import React from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Responsibles from './pages/Responsibles';
import Spaces from './pages/Spaces';
import Bookings from './pages/Bookings';
import Visits from './pages/Visits';
import Values from './pages/Values';
import AllRecords from './pages/AllRecords';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <div className="h-screen flex items-center justify-center text-brand-600 font-bold">Iniciando Cedência de Espaços...</div>;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;

  return <Layout>{children}</Layout>;
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/clientes" element={<ProtectedRoute><Customers /></ProtectedRoute>} />
      <Route path="/responsaveis" element={<ProtectedRoute><Responsibles /></ProtectedRoute>} />
      <Route path="/espacos" element={<ProtectedRoute><Spaces /></ProtectedRoute>} />
      <Route path="/visitas" element={<ProtectedRoute><Visits /></ProtectedRoute>} />
      <Route path="/processos" element={<ProtectedRoute><Bookings /></ProtectedRoute>} />
      <Route path="/valores" element={<ProtectedRoute><Values /></ProtectedRoute>} />
      <Route path="/registos" element={<ProtectedRoute><AllRecords /></ProtectedRoute>} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </AuthProvider>
  );
};

export default App;
