
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";

interface CourseOption {
  id: string;
  title: string;
}

interface AdminOption {
  id: string;
  name: string;
}

export const useGroupFormData = (isOpen?: boolean) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [admins, setAdmins] = useState<AdminOption[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    
    const fetchData = async () => {
      if (!profile) return;
      
      try {
        setCoursesLoading(true);
        
        // Fetch courses
        const { data: adminCoursesData, error: coursesError } = await supabase
          .from('admin_courses')
          .select(`
            course:courses(id, title)
          `)
          .eq('admin_id', profile.id);
        
        if (coursesError) throw coursesError;
        
        const courseOptions = (adminCoursesData || [])
          .filter(item => item.course)
          .map(item => ({
            id: (item.course as any).id,
            title: (item.course as any).title
          }));
        
        setCourses(courseOptions);

        // Fetch other admins
        const { data: adminsData, error: adminsError } = await supabase
          .from('profiles')
          .select('id, name')
          .eq('role', 'admin')
          .neq('id', profile.id);
        
        if (adminsError) throw adminsError;
        
        setAdmins(adminsData || []);
      } catch (error) {
        console.error('Error fetching form data:', error);
        toast({
          title: "Error",
          description: "Failed to load form data",
          variant: "destructive",
        });
      } finally {
        setCoursesLoading(false);
      }
    };
    
    fetchData();
  }, [profile, toast, isOpen]);

  return {
    courses,
    admins,
    coursesLoading,
  };
};
