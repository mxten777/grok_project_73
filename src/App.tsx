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
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-800">
              <div className="text-center">
                <div className="relative">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 border-t-primary-600 mx-auto"></div>
                  <div className="absolute inset-0 rounded-full h-16 w-16 border-4 border-transparent border-t-secondary-500 animate-spin mx-auto" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                </div>
                <p className="mt-6 text-lg font-medium text-neutral-900 dark:text-neutral-100 font-display">로딩 중...</p>
                <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">잠시만 기다려주세요</p>
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
