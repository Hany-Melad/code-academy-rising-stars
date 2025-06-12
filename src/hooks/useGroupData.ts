
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";

interface GroupData {
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
    description: string;
  };
  students: Array<{
    id: string;
    name: string;
    unique_id: string;
    total_points: number;
    remaining_sessions: number;
    total_sessions: number;
  }>;
}

export const useGroupData = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [group, setGroup] = useState<GroupData | null>(null);
  const [students, setStudents] = useState<Array<{
    id: string;
    name: string;
    unique_id: string;
    total_points: number;
    remaining_sessions: number;
    total_sessions: number;
  }>>([]);
  const [loading, setLoading] = useState(true);

  const fetchGroupDetails = async (groupId: string, adminId: string) => {
    try {
      setLoading(true);
      
      const { data: groupData, error: groupError } = await supabase
        .from('course_groups')
        .select(`
          *,
          course:courses(id, title, description)
        `)
        .eq('id', groupId)
        .single();

      if (groupError) throw groupError;

      const { data: studentsData, error: studentsError } = await supabase
        .from('course_group_students')
        .select(`
          profile:profiles(id, name, unique_id, total_points),
          student_course:student_courses!inner(
            id,
            subscription:student_course_subscription(remaining_sessions, total_sessions)
          )
        `)
        .eq('group_id', groupId);

      if (studentsError) throw studentsError;

      const studentsArray = (studentsData || [])
        .filter(item => item.profile && item.student_course)
        .map(item => {
          const subscription = (item.student_course as any)?.subscription?.[0];
          return {
            id: (item.profile as any).id,
            name: (item.profile as any).name,
            unique_id: (item.profile as any).unique_id,
            total_points: (item.profile as any).total_points,
            remaining_sessions: subscription?.remaining_sessions || 0,
            total_sessions: subscription?.total_sessions || 0
          };
        });

      setGroup({
        ...groupData,
        students: studentsArray
      });
      setStudents(studentsArray);
    } catch (error) {
      console.error('Error fetching group data:', error);
      toast({
        title: "Error",
        description: "Failed to load group data",
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
  };
};
