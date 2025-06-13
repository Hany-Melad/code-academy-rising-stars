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
}

interface StudentData {
  id: string;
  name: string;
  unique_id: string;
  total_points: number;
  remaining_sessions: number;
  total_sessions: number;
}

export const useGroupData = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [group, setGroup] = useState<GroupData | null>(null);
  const [students, setStudents] = useState<StudentData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGroupDetails = async (groupId: string, adminId: string) => {
    try {
      setLoading(true);

      // Get group info
      const { data: groupData, error: groupError } = await supabase
        .from('course_groups')
        .select(`
          *,
          course:courses(id, title, description)
        `)
        .eq('id', groupId)
        .single();

      if (groupError) throw groupError;

      // Get students from the new flat view
      const { data: studentsData, error: studentsError } = await supabase
        .from('course_group_students_flat')
        .select('*')
        .eq('group_id', groupId);

      if (studentsError) throw studentsError;

      const studentsArray: StudentData[] = (studentsData || []).map((item: any) => ({
        id: item.student_id,
        name: item.name,
        unique_id: item.unique_id,
        total_points: item.total_points,
        remaining_sessions: item.remaining_sessions || 0,
        total_sessions: item.total_sessions || 0,
      }));

      setGroup(groupData);
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
