import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface GroupLeaderboardStudent {
  id: string;
  name: string;
  unique_id: string;
  points: number;
  rank: number;
}

export const useGroupLeaderboard = (groupId: string) => {
  const { toast } = useToast();
  const [students, setStudents] = useState<GroupLeaderboardStudent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGroupLeaderboard = async () => {
    if (!groupId) return;
    
    try {
      setLoading(true);
      
      // First get all students in the group
      const { data: groupStudents, error: groupError } = await supabase
        .from('course_group_students')
        .select(`
          student_id,
          profiles!course_group_students_student_id_fkey(
            id,
            name,
            unique_id
          )
        `)
        .eq('group_id', groupId);

      if (groupError) throw groupError;

      // Then get their points (if any)
      const { data: pointsData, error: pointsError } = await supabase
        .from('student_group_points')
        .select('student_id, points')
        .eq('group_id', groupId);

      if (pointsError) throw pointsError;

      // Create a map of student points
      const pointsMap = (pointsData || []).reduce((acc, item) => {
        acc[item.student_id] = item.points;
        return acc;
      }, {} as Record<string, number>);

      // Combine students with their points (default to 0 if no points record)
      const leaderboardData = (groupStudents || [])
        .filter(item => item.profiles)
        .map((item) => ({
          id: (item.profiles as any).id,
          name: (item.profiles as any).name,
          unique_id: (item.profiles as any).unique_id,
          points: pointsMap[item.student_id] || 0,
          rank: 0 // Will be calculated after sorting
        }))
        .sort((a, b) => b.points - a.points)
        .map((item, index) => ({
          ...item,
          rank: index + 1
        }));

      setStudents(leaderboardData);
    } catch (error) {
      console.error('Error fetching group leaderboard:', error);
      toast({
        title: "Error",
        description: "Failed to load group leaderboard",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateStudentGroupPoints = async (studentId: string, pointsToAdd: number) => {
    try {
      // First, try to get existing record
      const { data: existingRecord } = await supabase
        .from('student_group_points')
        .select('points')
        .eq('student_id', studentId)
        .eq('group_id', groupId)
        .single();

      if (existingRecord) {
        // Update existing record
        const { error } = await supabase
          .from('student_group_points')
          .update({ points: existingRecord.points + pointsToAdd })
          .eq('student_id', studentId)
          .eq('group_id', groupId);

        if (error) throw error;
      } else {
        // Create new record
        const { error } = await supabase
          .from('student_group_points')
          .insert({
            student_id: studentId,
            group_id: groupId,
            points: pointsToAdd
          });

        if (error) throw error;
      }

      // Refresh leaderboard
      fetchGroupLeaderboard();
    } catch (error) {
      console.error('Error updating group points:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchGroupLeaderboard();
  }, [groupId]);

  return {
    students,
    loading,
    fetchGroupLeaderboard,
    updateStudentGroupPoints,
  };
};