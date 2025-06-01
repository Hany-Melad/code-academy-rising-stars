
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';

// Import pages
import Index from '@/pages/Index';
import AuthPage from '@/pages/AuthPage';
import About from '@/pages/About';
import CoursesPage from '@/pages/CoursesPage';
import LeaderboardPage from '@/pages/LeaderboardPage';
import StudentDashboard from '@/pages/StudentDashboard';
import AdminDashboard from '@/pages/AdminDashboard';
import ProfilePage from '@/pages/ProfilePage';
import CourseDetailStudentPage from '@/pages/CourseDetailStudentPage';
import SessionViewPage from '@/pages/SessionViewPage';
import StudentCertificatespage from '@/pages/StudentCertificatespage';
import AdminCertificatespage from '@/pages/AdminCertificatespage';
import NotFound from '@/pages/NotFound';
import VerifyResetPage from '@/pages/VerifyResetPage';

// Admin pages
import CourseDetailPage from '@/pages/admin/CourseDetailPage';
import AdminSessionPage from '@/pages/admin/AdminSessionPage';
import GroupsPage from '@/pages/admin/GroupsPage';
import GroupDetailPage from '@/pages/admin/GroupDetailPage';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/verify-reset" element={<VerifyResetPage />} />
            <Route path="/about" element={<About />} />
            <Route path="/courses" element={<CoursesPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            
            {/* Protected student routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute requiredRole="student">
                  <StudentDashboard />
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
              path="/courses/:courseId"
              element={
                <ProtectedRoute requiredRole="student">
                  <CourseDetailStudentPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/session/:sessionId"
              element={
                <ProtectedRoute requiredRole="student">
                  <SessionViewPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/StudentCertificatespage"
              element={
                <ProtectedRoute requiredRole="student">
                  <StudentCertificatespage />
                </ProtectedRoute>
              }
            />

            {/* Protected admin routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/courses/:courseId"
              element={
                <ProtectedRoute requiredRole="admin">
                  <CourseDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/sessions/:sessionId"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminSessionPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/groups"
              element={
                <ProtectedRoute requiredRole="admin">
                  <GroupsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/groups/:groupId"
              element={
                <ProtectedRoute requiredRole="admin">
                  <GroupDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/AdminCertificatespage"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminCertificatespage />
                </ProtectedRoute>
              }
            />

            {/* Catch all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
