
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import { supabase, ensureValidRole } from "@/lib/supabase";
import { SessionsTab } from "@/components/admin/SessionsTab";
import { StudentsTab } from "@/components/admin/StudentsTab";
import { Course, Profile, Session } from "@/types/supabase";

const CourseDetailPage = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [course, setCourse] = useState<Course | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolledStudents, setEnrolledStudents] = useState<Profile[]>([]);
  
  useEffect(() => {
    const fetchCourseDetails = async () => {
      try {
        if (!courseId) return;
        
        console.log("Fetching course details for:", courseId);
        
        // Fetch course details
        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .select('*')
          .eq('id', courseId)
          .single();
        
        if (courseError) {
          console.error("Course fetch error:", courseError);
          throw courseError;
        }
        setCourse(courseData);
        
        // Fetch sessions
        const { data: sessionsData, error: sessionsError } = await supabase
          .from('sessions')
          .select('*')
          .eq('course_id', courseId)
          .order('order_number', { ascending: true });
        
        if (sessionsError) {
          console.error("Sessions fetch error:", sessionsError);
          throw sessionsError;
        }
        setSessions(sessionsData || []);
        
        // Fetch enrolled students
        const { data: enrolledData, error: enrolledError } = await supabase
          .from('student_courses')
          .select('student_id')
          .eq('course_id', courseId);
        
        if (enrolledError) {
          console.error("Enrolled students fetch error:", enrolledError);
          throw enrolledError;
        }
        
        if (enrolledData && enrolledData.length > 0) {
          const studentIds = enrolledData.map(sc => sc.student_id);
          
          const { data: studentsData, error: studentsError } = await supabase
            .from('profiles')
            .select('*')
            .in('id', studentIds);
          
          if (studentsError) {
            console.error("Students data fetch error:", studentsError);
            throw studentsError;
          }
          
          const typedStudents = (studentsData || []).map(student => ({
            ...student,
            role: ensureValidRole(student.role)
          }));
          
          setEnrolledStudents(typedStudents);
        }
        
      } catch (error) {
        console.error('Error fetching course details:', error);
        toast({
          title: "Error",
          description: "Failed to load course details.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchCourseDetails();
  }, [courseId, toast]);

  const handleSessionCreated = (newSession: Session) => {
    setSessions([...sessions, newSession]);
  };

  const handleCourseUpdated = (updatedCourse: Course) => {
    setCourse(updatedCourse);
  };

  const handleStudentEnrolled = (student: Profile) => {
    setEnrolledStudents([...enrolledStudents, student]);
  };

  const handleStudentRemoved = (studentId: string) => {
    setEnrolledStudents(enrolledStudents.filter(s => s.id !== studentId));
  };
  
  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[80vh]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-academy-blue mx-auto mb-4" />
            <p className="text-lg text-gray-600">Loading course details...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }
  
  if (!course) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Course not found</h2>
          <p className="text-gray-600 mb-6">The course you're looking for doesn't exist or you don't have access.</p>
          <Button onClick={() => navigate('/admin')}>Return to Dashboard</Button>
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-1">{course.title}</h1>
            <p className="text-muted-foreground">
              {course.description || "No description provided"}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {course.total_sessions} {course.total_sessions === 1 ? 'session' : 'sessions'}
            </p>
          </div>

          <div className="flex gap-2">
            <Button onClick={() => navigate('/admin')} variant="outline">
              Back to Dashboard
            </Button>
            <Button onClick={() => navigate('/certificates')}>
              Go to Certificates
            </Button>
          </div>



        </div>
        
        <Tabs defaultValue="sessions" className="w-full">
          <TabsList>
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
            <TabsTrigger value="students">Enrolled Students</TabsTrigger>
          </TabsList>
          
          <TabsContent value="sessions" className="space-y-4">
            <SessionsTab
              course={course}
              sessions={sessions}
              onSessionCreated={handleSessionCreated}
              onCourseUpdated={handleCourseUpdated}
            />
          </TabsContent>
          
          <TabsContent value="students" className="space-y-4">
            <StudentsTab
              courseId={course.id}
              enrolledStudents={enrolledStudents}
              onStudentEnrolled={handleStudentEnrolled}
              onStudentRemoved={handleStudentRemoved}
            />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default CourseDetailPage;
