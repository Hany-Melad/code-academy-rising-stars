
import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { LeaderboardCard } from "@/components/dashboard/LeaderboardCard";
import { ProgressGraph } from "@/components/dashboard/ProgressGraph";
import { CourseCard } from "@/components/courses/CourseCard";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase, ensureValidRole } from "@/lib/supabase";
import { Course, Profile, StudentCourse } from "@/types/supabase";
import { Award, BookOpen, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const StudentDashboard = () => {
  const { profile, user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [courses, setCourses] = useState<{course: Course, studentCourse: StudentCourse}[]>([]);
  const [topStudents, setTopStudents] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataFetched, setDataFetched] = useState(false);
  const [stats, setStats] = useState({
    totalCourses: 0,
    completedCourses: 0,
    completedSessions: 0,
    totalPoints: 0,
  });

  useEffect(() => {
    console.log("StudentDashboard useEffect triggered");
    console.log("Auth loading:", authLoading);
    console.log("User:", user);
    console.log("Profile:", profile);
    console.log("Data fetched:", dataFetched);

    // Don't fetch if auth is still loading or data already fetched
    if (authLoading || dataFetched) {
      console.log("Skipping fetch - auth loading or data already fetched");
      return;
    }

    // If no user, set error and stop loading
    if (!user) {
      console.log("No user found");
      setError("Please sign in to view your dashboard");
      setLoading(false);
      return;
    }

    // If no profile yet, wait for it
    if (!profile) {
      console.log("No profile found, waiting...");
      return;
    }

    const fetchDashboardData = async () => {
      try {
        console.log("Starting dashboard data fetch for user:", user.id);
        setLoading(true);
        setError(null);
        
        // Fetch enrolled courses
        console.log("Fetching enrolled courses for profile:", profile.id);
        const { data: enrolledCoursesData, error: enrolledError } = await supabase
          .from('student_courses')
          .select(`
            *,
            course:courses(*)
          `)
          .eq('student_id', profile.id);
        
        if (enrolledError) {
          console.error("Error fetching enrolled courses:", enrolledError);
          throw enrolledError;
        }
        
        console.log("Enrolled courses data:", enrolledCoursesData);
        
        // Format courses data
        const formattedCourses = (enrolledCoursesData || [])
          .filter(data => data.course)
          .map(data => ({
            course: data.course as Course,
            studentCourse: {
              id: data.id,
              student_id: data.student_id,
              course_id: data.course_id,
              progress: data.progress || 0,
              assigned_at: data.assigned_at,
              assigned_by: data.assigned_by,
              completed_at: data.completed_at,
            } as StudentCourse
          }));
        
        setCourses(formattedCourses);
        
        // Calculate stats
        setStats({
          totalCourses: formattedCourses.length,
          completedCourses: formattedCourses.filter(c => 
            c.course.total_sessions > 0 && c.studentCourse.progress >= c.course.total_sessions
          ).length,
          completedSessions: formattedCourses.reduce((acc, curr) => 
            acc + (curr.studentCourse.progress || 0), 0
          ),
          totalPoints: profile.total_points || 0,
        });
        
        // Fetch top students
        console.log("Fetching top students");
        const { data: studentsData, error: studentsError } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'student')
          .order('total_points', { ascending: false })
          .limit(5);
        
        if (studentsError) {
          console.error("Error fetching top students:", studentsError);
        } else {
          console.log("Top students data:", studentsData);
          const typedStudents = (studentsData || []).map(student => ({
            ...student,
            role: ensureValidRole(student.role)
          }));
          setTopStudents(typedStudents);
        }
        
        setDataFetched(true);
        console.log("Dashboard data fetch completed successfully");
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setError(`Failed to load dashboard: ${errorMessage}`);
        toast({
          title: "Error",
          description: "Failed to load dashboard data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [profile, user, authLoading, dataFetched, toast]);
  
  // Prepare progress graph data
  const progressData = courses.map(({ course, studentCourse }) => ({
    name: course.title.length > 15 ? course.title.substring(0, 15) + '...' : course.title,
    completed: studentCourse.progress || 0,
    total: course.total_sessions || 0,
  }));

  // Show loading state
  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[80vh]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-t-academy-blue border-r-transparent border-b-academy-orange border-l-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-lg text-gray-600">Loading dashboard data...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Show error state
  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[80vh]">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Dashboard Error</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => {
              setError(null);
              setDataFetched(false);
              setLoading(true);
            }}>
              Try Again
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-1">Welcome back, {profile?.name}!</h1>
          <p className="text-muted-foreground">Here's an overview of your learning progress</p>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard 
            title="Total Courses"
            value={stats.totalCourses}
            icon={BookOpen}
            colorVariant="blue"
          />
          <StatsCard 
            title="Completed Courses"
            value={stats.completedCourses}
            icon={CheckCircle}
            colorVariant="green"
          />
          <StatsCard 
            title="Completed Sessions"
            value={stats.completedSessions}
            icon={Clock}
            colorVariant="orange"
          />
          <StatsCard 
            title="Total Points"
            value={stats.totalPoints}
            icon={Award}
            colorVariant="purple"
          />
        </div>
        
        {/* Progress and Leaderboard */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ProgressGraph 
            data={progressData}
            className="lg:col-span-2"
          />
          <LeaderboardCard students={topStudents} />
        </div>
        
        {/* Enrolled courses */}
        <div>
          <h2 className="text-xl font-bold mb-4">Your Courses</h2>
          {courses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map(({ course, studentCourse }) => (
                <CourseCard 
                  key={course.id} 
                  course={course}
                  studentCourse={studentCourse}
                />
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
              <h3 className="font-medium text-gray-900 mb-1">No courses yet</h3>
              <p className="text-gray-600">
                You are not enrolled in any courses yet. Browse available courses to get started.
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentDashboard;
