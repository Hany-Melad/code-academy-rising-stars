
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
          profile:profiles(id, name, unique_id, total_points)
        `)
        .eq('group_id', groupId);

      if (studentsError) throw studentsError;

      // Get global subscription data for each student
      const studentsArray = [];
      for (const item of studentsData || []) {
        if (!item.profile) continue;
        
        const profile = item.profile as any;
        
        // Get the student's global subscription from any of their courses
        const { data: studentCourses } = await supabase
          .from('student_courses')
          .select(`
            student_course_subscription(remaining_sessions, total_sessions)
          `)
          .eq('student_id', profile.id)
          .limit(1);

        let subscriptionData = { remaining_sessions: 0, total_sessions: 0 };
        if (studentCourses && studentCourses.length > 0) {
          const subscription = (studentCourses[0] as any)?.student_course_subscription?.[0];
          if (subscription) {
            subscriptionData = {
              remaining_sessions: subscription.remaining_sessions,
              total_sessions: subscription.total_sessions
            };
          }
        }

        studentsArray.push({
          id: profile.id,
          name: profile.name,
          unique_id: profile.unique_id,
          total_points: profile.total_points,
          remaining_sessions: subscriptionData.remaining_sessions,
          total_sessions: subscriptionData.total_sessions
        });
      }

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
