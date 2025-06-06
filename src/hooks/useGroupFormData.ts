
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";

interface CourseOption {
  id: string;
  title: string;
}

export const useGroupFormData = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      if (!profile) return;
      
      try {
        setLoading(true);
        
        const { data: adminCoursesData, error } = await supabase
          .from('admin_courses')
          .select(`
            course:courses(id, title)
          `)
          .eq('admin_id', profile.id);
        
        if (error) throw error;
        
        const courseOptions = (adminCoursesData || [])
          .filter(item => item.course)
          .map(item => ({
            id: item.course!.id,
            title: item.course!.title
          }));
        
        setCourses(courseOptions);
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
    
    fetchCourses();
  }, [profile, toast]);

  return {
    courses,
    loading,
  };
};
