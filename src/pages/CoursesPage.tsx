
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { MainLayout } from "@/components/MainLayout";
import { CourseCard } from "@/components/courses/CourseCard";
import { AdminCourseCard } from "@/components/courses/CourseCardWithAdmin";
import { supabase } from "@/lib/supabase";
import { Course, StudentCourse, Profile } from "@/types/supabase";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

const CoursesPage = () => {
  const { profile, user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [studentCourses, setStudentCourses] = useState<StudentCourse[]>([]);
  const [globalSubscriptionExpired, setGlobalSubscriptionExpired] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);

        if (isAdmin) {
          // For admin, show all courses
          const { data: allCourses, error: coursesError } = await supabase
            .from('courses')
            .select('*')
            .order('created_at', { ascending: false });

          if (coursesError) {
            console.error('Error fetching courses:', coursesError);
            throw coursesError;
          }

          setCourses(allCourses || []);
        } else {
          // For students, only show enrolled courses
          if (!profile?.id) {
            console.log('No profile ID found');
            return;
          }

          const { data: studentCoursesData, error: studentCoursesError } = await supabase
            .from('student_courses')
            .select(`
              *,
              course:courses(*)
            `)
            .eq('student_id', profile.id);

          if (studentCoursesError) {
            console.error('Error fetching student courses:', studentCoursesError);
            throw studentCoursesError;
          }

          console.log('Student courses data:', studentCoursesData);

          // Check global subscription status
          let subscriptionExpired = false;
          if (studentCoursesData && studentCoursesData.length > 0) {
            const { data: subscriptionData } = await supabase
              .from('student_course_subscription')
              .select('remaining_sessions')
              .eq('student_course_id', studentCoursesData[0].id)
              .order('updated_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            if (subscriptionData) {
              subscriptionExpired = subscriptionData.remaining_sessions === 0;
            }
          }

          setGlobalSubscriptionExpired(subscriptionExpired);

          // If subscription is expired, hide all courses
          if (subscriptionExpired) {
            setCourses([]);
            setStudentCourses([]);
          } else {
            // Extract courses and student course data
            const enrolledCourses = (studentCoursesData || [])
              .filter(item => item.course)
              .map(item => item.course as Course);

            setCourses(enrolledCourses);
            setStudentCourses(studentCoursesData || []);
          }
        }

      } catch (error) {
        console.error('Error fetching courses:', error);
        toast({
          title: "Error",
          description: "Failed to load courses",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (user && profile) {
      fetchCourses();
    }
  }, [profile, user, isAdmin, toast]);

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-academy-blue" />
            <p className="text-lg text-gray-600">Loading courses...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {isAdmin ? "All Courses" : "My Courses"}
          </h1>
          <p className="mt-2 text-gray-600">
            {isAdmin 
              ? "Manage and view all courses in the academy"
              : globalSubscriptionExpired
                ? "Your subscription has expired. Contact your instructor to renew your sessions."
                : courses.length > 0 
                  ? "Continue your learning journey with your enrolled courses"
                  : "You haven't enrolled in any courses yet. Contact your instructor to get started."
            }
          </p>
        </div>

        {courses.length === 0 ? (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {isAdmin 
                  ? "No courses available" 
                  : globalSubscriptionExpired 
                    ? "Subscription Expired"
                    : "No available courses"
                }
              </h3>
              <p className="text-gray-600">
                {isAdmin 
                  ? "Create your first course to get started."
                  : globalSubscriptionExpired
                    ? "Your global subscription has expired. All courses are temporarily locked until you renew your sessions."
                    : "Contact your instructor or admin to enroll in courses."
                }
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => {
              if (isAdmin) {
                return <AdminCourseCard key={course.id} course={course} />;
              } else {
                const studentCourse = studentCourses.find(sc => sc.course_id === course.id);
                return (
                  <CourseCard 
                    key={course.id} 
                    course={course} 
                    studentCourse={studentCourse}
                    globalSubscriptionExpired={globalSubscriptionExpired}
                  />
                );
              }
            })}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default CoursesPage;
