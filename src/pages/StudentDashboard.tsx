
import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { ProgressGraph } from "@/components/dashboard/ProgressGraph";
import { LeaderboardCard } from "@/components/dashboard/LeaderboardCard";
import { SubscriptionCard } from "@/components/dashboard/SubscriptionCard";
import { NotificationsCard } from "@/components/dashboard/NotificationsCard";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Course, StudentCourse, Profile } from "@/types/supabase";
import { Book, Trophy, CheckCircle, Clock } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const StudentDashboard = () => {
  const { profile, user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [studentCourses, setStudentCourses] = useState<StudentCourse[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [students, setStudents] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [dataFetched, setDataFetched] = useState(false);

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

    // If no user or profile, wait
    if (!user || !profile) {
      console.log("No user or profile found, waiting...");
      return;
    }

    const fetchStudentDashboardData = async () => {
      try {
        console.log("Starting student dashboard data fetch for profile:", profile.id);
        setLoading(true);

        // Fetch courses the student is enrolled in
        console.log("Fetching student courses...");
        const { data: studentCoursesData, error: studentCoursesError } = await supabase
          .from('student_courses')
          .select(`
            *,
            course:courses(*)
          `)
          .eq('student_id', profile.id);

        if (studentCoursesError) {
          console.error("Error fetching student courses:", studentCoursesError);
          throw studentCoursesError;
        }

        console.log("Student courses data:", studentCoursesData);
        const enrolledCourses = (studentCoursesData || [])
          .filter(item => item.course)
          .map(item => ({
            ...item.course as Course,
            progress: item.progress,
            student_course_id: item.id,
          }));

        setCourses(enrolledCourses);
        setStudentCourses(studentCoursesData);

        // Fetch global subscription using the first student course (get latest one)
        if (studentCoursesData && studentCoursesData.length > 0) {
          console.log("Fetching subscription for student course:", studentCoursesData[0].id);
          
          const { data: subscriptionData, error: subscriptionsError } = await supabase
            .from('student_course_subscription')
            .select('*')
            .eq('student_course_id', studentCoursesData[0].id)
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          console.log("Subscription query result:", { subscriptionData, subscriptionsError });

          if (subscriptionsError) {
            console.error("Error fetching subscription:", subscriptionsError);
          } else if (subscriptionData) {
            // This is the global subscription - calculate correct total sessions
            const correctTotalSessions = subscriptionData.plan_duration_months * 4;
            const subscriptionWithCorrectTotal = {
              ...subscriptionData,
              total_sessions: correctTotalSessions,
              course_title: 'Global Subscription'
            };
            console.log("Setting subscription data:", subscriptionWithCorrectTotal);
            setSubscriptions([subscriptionWithCorrectTotal]);
          } else {
            console.log("No subscription found, setting empty array");
            setSubscriptions([]);
          }
        } else {
          console.log("No student courses found, setting empty subscription array");
          setSubscriptions([]);
        }

        // Fetch leaderboard data (top students)
        const { data: leaderboardData, error: leaderboardError } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'student')
          .order('total_points', { ascending: false })
          .limit(10);

        if (leaderboardError) {
          console.error("Error fetching leaderboard:", leaderboardError);
        } else {
          // Type cast the role to match the expected type
          const typedLeaderboardData = (leaderboardData || []).map(student => ({
            ...student,
            role: student.role as 'student' | 'admin'
          }));
          setStudents(typedLeaderboardData);
        }

        setDataFetched(true);
        console.log("Student dashboard data fetch completed successfully");

      } catch (error) {
        console.error('Error fetching student dashboard data:', error);
        toast({
          title: "Error",
          description: "Failed to load dashboard data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStudentDashboardData();
  }, [profile, user, authLoading, dataFetched, toast]);

  // Prepare progress data for the graph using studentCourses data
  const progressData = studentCourses.map(studentCourse => {
    const course = courses.find(c => c.id === studentCourse.course_id);
    return {
      name: course?.title.length && course.title.length > 15 ? course.title.substring(0, 15) + '...' : course?.title || 'Unknown',
      completed: Math.floor((studentCourse.progress / 100) * (course?.total_sessions || 0)),
      total: course?.total_sessions || 0
    };
  });

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

  console.log("Rendering dashboard with subscriptions:", subscriptions);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-1">Welcome back, {profile?.name}!</h1>
          <p className="text-muted-foreground">Here's your learning progress overview</p>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard 
            title="Enrolled Courses"
            value={courses.length}
            icon={Book}
            colorVariant="blue"
          />
          <StatsCard 
            title="Total Points"
            value={profile?.total_points || 0}
            icon={Trophy}
            colorVariant="orange"
          />
          <StatsCard 
            title="Completed Courses"
            value={studentCourses.filter(sc => sc.progress === 100).length}
            icon={CheckCircle}
            colorVariant="green"
          />
          <StatsCard 
            title="Active Sessions"
            value={subscriptions.reduce((total, sub) => total + (sub.remaining_sessions || 0), 0)}
            icon={Clock}
            description="Sessions remaining"
            colorVariant="purple"
          />
        </div>
        
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Progress and Leaderboard */}
          <div className="space-y-6">
            <ProgressGraph data={progressData} />
            <LeaderboardCard students={students} />
          </div>
          
          {/* Subscription and Notifications */}
          <div className="space-y-6">
            <SubscriptionCard subscriptions={subscriptions} />
            <NotificationsCard />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentDashboard;
