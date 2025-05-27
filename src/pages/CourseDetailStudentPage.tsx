
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { SessionCard } from "@/components/courses/SessionCard";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, BookOpen, ArrowLeft } from "lucide-react";
import type { Tables } from '@/integrations/supabase/types';

type Session = Tables<'sessions'>;
type Course = Tables<'courses'>;
type StudentCourse = Tables<'student_courses'>;
type StudentSession = Tables<'student_sessions'>;

const CourseDetailStudentPage = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { toast } = useToast();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [studentCourse, setStudentCourse] = useState<StudentCourse | null>(null);
  const [studentSessions, setStudentSessions] = useState<StudentSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        if (!courseId || !profile) return;

        console.log('Checking enrollment for student:', profile.id, 'in course:', courseId);

        // Check enrollment first - this is critical for security
        const { data: enrollmentData, error: enrollmentError } = await supabase
          .from('student_courses')
          .select('*')
          .eq('student_id', profile.id)
          .eq('course_id', courseId)
          .maybeSingle();

        if (enrollmentError) {
          console.error('Enrollment check error:', enrollmentError);
          throw enrollmentError;
        }

        console.log('Enrollment data:', enrollmentData);

        if (!enrollmentData) {
          console.log('Student not enrolled in course');
          toast({
            title: "Access Denied",
            description: "You are not enrolled in this course.",
            variant: "destructive",
          });
          navigate('/dashboard');
          return;
        }

        setStudentCourse(enrollmentData);

        // Fetch course details
        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .select('*')
          .eq('id', courseId)
          .single();

        if (courseError) {
          console.error('Course fetch error:', courseError);
          throw courseError;
        }
        setCourse(courseData);

        // Fetch sessions
        const { data: sessionsData, error: sessionsError } = await supabase
          .from('sessions')
          .select('*')
          .eq('course_id', courseId)
          .order('order_number');

        if (sessionsError) {
          console.error('Sessions fetch error:', sessionsError);
          throw sessionsError;
        }
        setSessions(sessionsData || []);

        // Fetch student session progress - only for sessions where student has progress
        const { data: studentSessionsData, error: studentSessionsError } = await supabase
          .from('student_sessions')
          .select('*')
          .eq('student_id', profile.id);

        if (studentSessionsError) {
          console.error('Student sessions fetch error:', studentSessionsError);
          throw studentSessionsError;
        }
        
        console.log('Student sessions data:', studentSessionsData);
        setStudentSessions(studentSessionsData || []);

      } catch (error) {
        console.error('Error fetching course data:', error);
        toast({
          title: "Error",
          description: "Failed to load course data.",
          variant: "destructive",
        });
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchCourseData();
  }, [courseId, profile, navigate, toast]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[80vh]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-academy-blue mx-auto mb-4" />
            <p className="text-lg text-gray-600">Loading course...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!course || !studentCourse) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Course not found</h2>
          <p className="text-gray-600 mb-6">The course you're looking for doesn't exist or you don't have access.</p>
          <Button onClick={() => navigate('/dashboard')}>Return to Dashboard</Button>
        </div>
      </DashboardLayout>
    );
  }

  const completedSessions = studentSessions.filter(s => s.completed).length;
  const totalSessions = sessions.length;
  const progressPercentage = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/dashboard')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold mb-1">{course.title}</h1>
              <p className="text-muted-foreground">
                {course.description || "Continue your learning journey"}
              </p>
            </div>
          </div>
          <div className="text-right">
            <Badge variant="outline" className="mb-2">
              <BookOpen className="w-4 h-4 mr-1" />
              {completedSessions} / {totalSessions} completed
            </Badge>
            <div className="text-sm text-muted-foreground">
              {progressPercentage}% complete
            </div>
          </div>
        </div>

        {/* Progress Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Course Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={progressPercentage} className="mb-2" />
            <p className="text-sm text-muted-foreground">
              You've completed {completedSessions} out of {totalSessions} sessions
            </p>
          </CardContent>
        </Card>

        {/* Sessions */}
        <div>
          <h2 className="text-xl font-bold mb-4">Course Sessions</h2>
          {sessions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sessions.map((session, index) => {
                const studentSession = studentSessions.find(ss => ss.session_id === session.id);
                
                // A session is locked if:
                // 1. It's not the first session AND
                // 2. The previous session is not completed by this student
                const isLocked = index > 0 && !studentSessions.find(ss => 
                  ss.session_id === sessions[index - 1].id && ss.completed
                );
                
                // Session is visible if it has video content and is marked as visible
                const isVisible = Boolean(session.video_url && session.visible);
                
                return (
                  <SessionCard
                    key={session.id}
                    session={session}
                    studentSession={studentSession}
                    isLocked={isLocked}
                    courseId={courseId!}
                    isVisible={isVisible}
                  />
                );
              })}
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
              <h3 className="font-medium text-gray-900 mb-1">No sessions available</h3>
              <p className="text-gray-600">
                Sessions will appear here once the instructor adds them.
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CourseDetailStudentPage;
