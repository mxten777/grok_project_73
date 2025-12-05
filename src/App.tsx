import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ChatInitializer from './components/organisms/ChatInitializer';
import PWAInstallPrompt from './components/molecules/PWAInstallPrompt';
import Login from './pages/Login';
import Layout from './components/organisms/Layout';
import ProtectedRoute from './components/organisms/ProtectedRoute';
import { Suspense, lazy, memo } from 'react';

// Lazy load pages for better performance
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Approvals = lazy(() => import('./pages/Approvals'));
const Attendance = lazy(() => import('./pages/Attendance'));
const Messenger = lazy(() => import('./pages/Messenger'));
const Calendar = lazy(() => import('./pages/Calendar'));
const Notices = lazy(() => import('./pages/Notices'));
const Projects = lazy(() => import('./pages/Projects'));
const Admin = lazy(() => import('./pages/Admin'));

function App() {
  return (
    <AuthProvider>
      <ChatInitializer />
      <PWAInstallPrompt />
      <Router>
          <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">로딩 중...</p>
              </div>
            </div>
          }>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }>
                <Route index element={<Dashboard />} />
                <Route path="approvals" element={<Approvals />} />
                <Route path="attendance" element={<Attendance />} />
                <Route path="messenger" element={<Messenger />} />
                <Route path="calendar" element={<Calendar />} />
                <Route path="notices" element={<Notices />} />
                <Route path="projects" element={<Projects />} />
                <Route path="admin" element={<Admin />} />
              </Route>
            </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
}export default App;
