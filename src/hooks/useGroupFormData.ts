
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";

interface Course {
  id: string;
  title: string;
}

interface Admin {
  id: string;
  name: string;
}

export const useGroupFormData = (open: boolean) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(false);

  useEffect(() => {
    if (open && profile) {
      fetchCourses();
      fetchAdmins();
    }
  }, [open, profile]);

  const fetchCourses = async () => {
    if (!profile) return;

    try {
      setCoursesLoading(true);
      console.log('Fetching courses for admin:', profile.id);
      
      const { data, error } = await supabase
        .from('admin_courses')
        .select(`
          course:courses(id, title)
        `)
        .eq('admin_id', profile.id);

      if (error) throw error;

      console.log('Admin courses data:', data);

      const courseList = (data || [])
        .filter(item => item.course)
        .map(item => ({
          id: item.course!.id,
          title: item.course!.title
        }));

      console.log('Processed course list:', courseList);
      setCourses(courseList);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast({
        title: "Error",
        description: "Failed to load courses",
        variant: "destructive",
      });
    } finally {
      setCoursesLoading(false);
    }
  };

  const fetchAdmins = async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name')
        .eq('role', 'admin')
        .neq('id', profile.id);

      if (error) throw error;

      setAdmins(data || []);
    } catch (error) {
      console.error('Error fetching admins:', error);
    }
  };

  return {
    courses,
    admins,
    coursesLoading,
  };
};
