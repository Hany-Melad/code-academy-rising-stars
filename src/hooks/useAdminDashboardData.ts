
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase, ensureValidRole } from "@/lib/supabase";
import { Course, Profile } from "@/types/supabase";
import { useToast } from "@/components/ui/use-toast";

export const useAdminDashboardData = () => {
  const { profile, user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [dataFetched, setDataFetched] = useState(false);
  const [totalGroups, setTotalGroups] = useState(0);

  useEffect(() => {
    console.log("AdminDashboard useEffect triggered");
    console.log("Auth loading:", authLoading);
    console.log("User:", user);
    console.log("Profile:", profile);
    console.log("Data fetched:", dataFetched);

    if (authLoading || dataFetched) {
      console.log("Skipping fetch - auth loading or data already fetched");
      return;
    }

    if (!user || !profile) {
      console.log("No user or profile found, waiting...");
      return;
    }

    const fetchAdminDashboardData = async () => {
      try {
        console.log("Starting admin dashboard data fetch for profile:", profile.id);
        setLoading(true);
        
        console.log("Fetching admin courses...");
        const { data: adminCoursesData, error: adminCoursesError } = await supabase
          .from('admin_courses')
          .select(`
            course:courses(*)
          `)
          .eq('admin_id', profile.id);
        
        if (adminCoursesError) {
          console.error("Error fetching admin courses:", adminCoursesError);
          throw adminCoursesError;
        }
        
        console.log("Admin courses data:", adminCoursesData);
        const adminCourses = (adminCoursesData || [])
          .filter(item => item.course)
          .map(item => item.course) as unknown as Course[];
        
        setCourses(adminCourses);
        
        console.log("Fetching students...");
        const { data: studentsData, error: studentsError } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'student')
          .order('created_at', { ascending: false });
        
        if (studentsError) {
          console.error("Error fetching students:", studentsError);
          throw studentsError;
        }
        
        console.log("Students data:", studentsData);
        
        const typedStudents = (studentsData || []).map(student => ({
          ...student,
          role: ensureValidRole(student.role)
        }));
        
        setStudents(typedStudents);

        const { data: groupsData, error: groupsError } = await supabase
          .from('course_groups')
          .select('id', { count: 'exact' })
          .or(`created_by.eq.${profile.id},allowed_admin_id.eq.${profile.id}`);
        
        if (groupsError) {
          console.error("Error fetching groups:", groupsError);
        } else {
          setTotalGroups(groupsData?.length || 0);
        }
        
        setDataFetched(true);
        console.log("Admin dashboard data fetch completed successfully");
        
      } catch (error) {
        console.error('Error fetching admin dashboard data:', error);
        toast({
          title: "Error",
          description: "Failed to load dashboard data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchAdminDashboardData();
  }, [profile, user, authLoading, dataFetched, toast]);

  const refetchCourses = async () => {
    if (!profile) return;
    
    try {
      const { data: adminCoursesData, error: fetchError } = await supabase
        .from('admin_courses')
        .select(`
          course:courses(*)
        `)
        .eq('admin_id', profile.id);
      
      if (fetchError) throw fetchError;
      
      const adminCourses = (adminCoursesData || [])
        .filter(item => item.course)
        .map(item => item.course) as unknown as Course[];
      
      setCourses(adminCourses);
    } catch (error) {
      console.error('Error refetching courses:', error);
    }
  };

  return {
    courses,
    students,
    loading,
    authLoading,
    totalGroups,
    refetchCourses,
  };
};
