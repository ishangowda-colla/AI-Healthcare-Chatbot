// src/App.js
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LangProvider } from './context/LangContext';

// Pages
import LoginPage     from './pages/LoginPage';
import RegisterPage  from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ChatPage      from './pages/ChatPage';
import TabletsPage   from './pages/TabletsPage';
import WaterPage     from './pages/WaterPage';
import BMIPage       from './pages/BMIPage';
import VitalsPage    from './pages/VitalsPage';
import EmergencyPage from './pages/EmergencyPage';
import DiseasesPage  from './pages/DiseasesPage';

// Layout
import Layout from './components/Layout';

import './App.css';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="splash"><div className="spinner"/></div>;
  return user ? children : <Navigate to="/login" />;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="splash"><div className="spinner"/></div>;
  return user ? <Navigate to="/" /> : children;
}

export default function App() {
  return (
    <AuthProvider>
      <LangProvider>
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/login"    element={<PublicRoute><LoginPage/></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><RegisterPage/></PublicRoute>} />

            {/* Protected — wrapped in Layout (sidebar + header) */}
            <Route path="/" element={<PrivateRoute><Layout/></PrivateRoute>}>
              <Route index            element={<DashboardPage/>} />
              <Route path="chat"      element={<ChatPage/>} />
              <Route path="tablets"   element={<TabletsPage/>} />
              <Route path="water"     element={<WaterPage/>} />
              <Route path="bmi"       element={<BMIPage/>} />
              <Route path="vitals"    element={<VitalsPage/>} />
              <Route path="emergency" element={<EmergencyPage/>} />
              <Route path="diseases"  element={<DiseasesPage/>} />
            </Route>
          </Routes>
        </BrowserRouter>
      </LangProvider>
    </AuthProvider>
  );
}
