import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import JoinPage from './pages/JoinPage';
import SetupPage from './pages/SetupPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import HomePage from './pages/HomePage';
import HistoryPage from './pages/HistoryPage';
import MembersPage from './pages/MembersPage';
import MemberDetailPage from './pages/MemberDetailPage';
import ActivityPage from './pages/ActivityPage';

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('roomie_token');
  const member = localStorage.getItem('roomie_member');
  if (!token || !member) {
    return <Navigate to="/join" replace />;
  }
  return children;
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        {/* Public routes */}
        <Route path="/join" element={<JoinPage />} />
        <Route path="/setup" element={<SetupPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/history"
          element={
            <ProtectedRoute>
              <HistoryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/members"
          element={
            <ProtectedRoute>
              <MembersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/member/:id"
          element={
            <ProtectedRoute>
              <MemberDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/activity"
          element={
            <ProtectedRoute>
              <ActivityPage />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
