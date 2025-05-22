
import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { LeaderboardCard } from "@/components/dashboard/LeaderboardCard";
import { ProgressGraph } from "@/components/dashboard/ProgressGraph";
import { CourseCard } from "@/components/courses/CourseCard";
import { useAuth } from "@/contexts/AuthContext";
import { supabase, ensureValidRole } from "@/lib/supabase";
import { Course, Profile, StudentCourse } from "@/types/supabase";
import { Award, BookOpen, CheckCircle, Clock } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const StudentDashboard = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [courses, setCourses] = useState<{course: Course, studentCourse: StudentCourse}[]>([]);
  const [topStudents, setTopStudents] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCourses: 0,
    completedCourses: 0,
    completedSessions: 0,
    totalPoints: 0,
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        if (!profile) return;
        
        // Fetch enrolled courses
        const { data: enrolledCoursesData, error: enrolledError } = await supabase
          .from('student_courses')
          .select('*, course:courses(*)')
          .eq('student_id', profile.id);
        
        if (enrolledError) throw enrolledError;
        
        // Format courses data
        const formattedCourses = enrolledCoursesData?.map(data => ({
          course: data.course as Course,
          studentCourse: {
            id: data.id,
            student_id: data.student_id,
            course_id: data.course_id,
            progress: data.progress,
            assigned_at: data.assigned_at,
            assigned_by: data.assigned_by,
            completed_at: data.completed_at,
          } as StudentCourse
        })) || [];
        
        setCourses(formattedCourses);
        
        // Calculate stats
        setStats({
          totalCourses: formattedCourses.length,
          completedCourses: formattedCourses.filter(c => 
            c.studentCourse.progress === c.course.total_sessions
          ).length,
          completedSessions: formattedCourses.reduce((acc, curr) => 
            acc + curr.studentCourse.progress, 0
          ),
          totalPoints: profile.total_points,
        });
        
        // Fetch top students
        const { data: studentsData, error: studentsError } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'student')
          .order('total_points', { ascending: false })
          .limit(5);
        
        if (studentsError) throw studentsError;
        
        // Ensure correct typing for roles
        const typedStudents = (studentsData || []).map(student => ({
          ...student,
          role: ensureValidRole(student.role)
        }));
        
        setTopStudents(typedStudents);
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
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
  }, [profile, toast]);
  
  // Prepare progress graph data
  const progressData = courses.map(({ course, studentCourse }) => ({
    name: course.title.length > 15 ? course.title.substring(0, 15) + '...' : course.title,
    completed: studentCourse.progress,
    total: course.total_sessions,
  }));

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
