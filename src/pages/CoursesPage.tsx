import { useEffect, useState } from "react";
import { MainLayout } from "@/components/MainLayout";
import { CourseCard } from "@/components/courses/CourseCard";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search } from "lucide-react";
import type { Tables } from '@/integrations/supabase/types';

type Course = Tables<'courses'>;
type StudentCourse = Tables<'student_courses'>;

const CoursesPage = () => {
  const { user, profile } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [studentCourses, setStudentCourses] = useState<StudentCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        // Fetch all courses
        const { data: coursesData, error: coursesError } = await supabase
          .from('courses')
          .select('*');
        
        if (coursesError) throw coursesError;
        setCourses(coursesData || []);
        
        // Fetch student courses if user is logged in
        if (user && profile) {
          const { data: enrolledData, error: enrolledError } = await supabase
            .from('student_courses')
            .select('*')
            .eq('student_id', user.id);
          
          if (enrolledError) throw enrolledError;
          setStudentCourses(enrolledData || []);
        }
      } catch (error) {
        console.error('Error fetching courses:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCourses();
  }, [user, profile]);
  
  const filteredCourses = courses.filter(course => {
    const titleMatch = course.title.toLowerCase().includes(searchQuery.toLowerCase());
    const descMatch = course.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return titleMatch || descMatch;
  });
  
  const getStudentCourse = (courseId: string) => {
    return studentCourses.find(sc => sc.course_id === courseId);
  };
  
  const enrollInCourse = async (courseId: string) => {
    try {
      if (!user || !profile) {
        return;
      }
      
      // Check if already enrolled
      const isEnrolled = studentCourses.some(sc => sc.course_id === courseId);
      if (isEnrolled) {
        return;
      }
      
      // Enroll in course
      const { data, error } = await supabase
        .from('student_courses')
        .insert({
          student_id: user.id,
          course_id: courseId,
          progress: 0,
          assigned_at: new Date().toISOString(),
        })
        .select('*')
        .single();
      
      if (error) throw error;
      
      // Update local state
      setStudentCourses([...studentCourses, data]);
      
    } catch (error) {
      console.error('Error enrolling in course:', error);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold sm:text-4xl mb-4">Explore Our Courses</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover a wide range of coding courses designed for young learners. 
            From block-based programming to web development, there's something for everyone.
          </p>
        </div>
        
        {/* Search and filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-8">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              type="text"
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-academy-orange" />
          </div>
        ) : filteredCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <CourseCard 
                key={course.id} 
                course={course}
                studentCourse={getStudentCourse(course.id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900">No courses found</h3>
            <p className="mt-2 text-gray-500">Try adjusting your search query or check back later.</p>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default CoursesPage;
