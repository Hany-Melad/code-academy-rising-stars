
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { useGroupManagement } from "./useGroupManagement";

interface CourseGroup {
  id: string;
  title: string;
  branch: string | null;
  start_date: string;
  created_at: string;
  created_by: string;
  allowed_admin_id: string | null;
  course: {
    id: string;
    title: string;
    description: string | null;
  };
}

interface Student {
  id: string;
  name: string;
  unique_id: string | null;
  total_points: number;
  remaining_sessions: number;
  total_sessions: number;
}

export const useGroupData = () => {
  const { toast } = useToast();
  const { getStudentGlobalSubscription } = useGroupManagement();
  const [group, setGroup] = useState<CourseGroup | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGroupDetails = async (groupId: string, profileId: string) => {
    try {
      setLoading(true);
      console.log('Fetching group details for:', groupId);

      const { data: groupData, error: groupError } = await supabase
        .from('course_groups')
        .select(`
          *,
          course:courses(id, title, description)
        `)
        .eq('id', groupId)
        .single();

      if (groupError) {
        console.error('Error fetching group:', groupError);
        throw groupError;
      }
      
      console.log('Group data:', groupData);
      setGroup(groupData);

      const { data: studentsData, error: studentsError } = await supabase
        .from('course_group_students')
        .select(`
          student:profiles (
            id,
            name,
            unique_id,
            total_points
          )
        `)
        .eq('group_id', groupId);

      if (studentsError) {
        console.error('Error fetching students:', studentsError);
        throw studentsError;
      }

      console.log('Students data:', studentsData);

      const studentsWithSessions = await Promise.all(
        (studentsData || []).map(async (item) => {
          if (!item.student) return null;
          
          console.log('Processing student:', item.student);
          const subscriptionData = await getStudentGlobalSubscription(item.student.id);
          
          return {
            id: item.student.id,
            name: item.student.name,
            unique_id: item.student.unique_id,
            total_points: item.student.total_points,
            remaining_sessions: subscriptionData.remaining_sessions,
            total_sessions: subscriptionData.total_sessions,
          };
        })
      );

      const validStudents = studentsWithSessions.filter(Boolean) as Student[];
      console.log('Students with sessions:', validStudents);
      setStudents(validStudents);
    } catch (error) {
      console.error('Error fetching group details:', error);
      toast({
        title: "Error",
        description: "Failed to load group details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    group,
    students,
    loading,
    fetchGroupDetails,
    setGroup,
    setStudents,
    setLoading,
  };
};
