
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Pages
import Index from "./pages/Index";
import AuthPage from "./pages/AuthPage";
import VerifyResetPage from "./pages/VerifyResetPage";
import StudentDashboard from "./pages/StudentDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import CourseDetailPage from "./pages/admin/CourseDetailPage";
import CoursesPage from "./pages/CoursesPage";
import LeaderboardPage from "./pages/LeaderboardPage";
import ProfilePage from "./pages/ProfilePage";
import NotFound from "./pages/NotFound";
import SessionViewPage from "./pages/SessionViewPage";
import AdminSessionPage from "./pages/admin/AdminSessionPage";
import CourseDetailStudentPage from "./pages/CourseDetailStudentPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/auth/verify-reset" element={<VerifyResetPage />} />
            <Route path="/courses" element={<CoursesPage />} />
            
            {/* Protected student routes */}
            <Route element={<ProtectedRoute requiredRole="student" />}>
              <Route path="/dashboard" element={<StudentDashboard />} />
              <Route path="/leaderboard" element={<LeaderboardPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/courses/:courseId" element={<CourseDetailStudentPage />} />
              <Route path="/courses/:courseId/sessions/:sessionId" element={<SessionViewPage />} />
            </Route>
            
            {/* Protected admin routes */}
            <Route element={<ProtectedRoute requiredRole="admin" redirectPath="/dashboard" />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/courses/:courseId" element={<CourseDetailPage />} />
              <Route path="/admin/courses/:courseId/sessions/:sessionId" element={<AdminSessionPage />} />
            </Route>
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
