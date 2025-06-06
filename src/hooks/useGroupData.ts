
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";

interface GroupData {
  id: string;
  title: string;
  branch: string | null;
  start_date: string;
  course: {
    id: string;
    title: string;
  };
  students: Array<{
    id: string;
    name: string;
    unique_id: string;
    total_points: number;
  }>;
}

export const useGroupData = (groupId: string) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [group, setGroup] = useState<GroupData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchGroupData = async () => {
    if (!profile || !groupId) return;
    
    try {
      setLoading(true);
      
      const { data: groupData, error: groupError } = await supabase
        .from('course_groups')
        .select(`
          *,
          course:courses(id, title)
        `)
        .eq('id', groupId)
        .single();

      if (groupError) throw groupError;

      const { data: studentsData, error: studentsError } = await supabase
        .from('course_group_students')
        .select(`
          profile:profiles(id, name, unique_id, total_points)
        `)
        .eq('group_id', groupId);

      if (studentsError) throw studentsError;

      const students = (studentsData || [])
        .filter(item => item.profile)
        .map(item => ({
          id: item.profile!.id,
          name: item.profile!.name,
          unique_id: item.profile!.unique_id,
          total_points: item.profile!.total_points
        }));

      setGroup({
        ...groupData,
        students
      });
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

  useEffect(() => {
    fetchGroupData();
  }, [groupId, profile]);

  return {
    group,
    loading,
    refetch: fetchGroupData,
  };
};
