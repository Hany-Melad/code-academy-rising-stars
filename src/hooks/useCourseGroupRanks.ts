import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface CourseGroupRank {
  courseId: string;
  groupId: string;
  groupTitle: string;
  rank: number;
  points: number;
  totalStudents: number;
}

export const useCourseGroupRanks = () => {
  const { profile } = useAuth();
  const [courseGroupRanks, setCourseGroupRanks] = useState<Record<string, CourseGroupRank[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.id) return;

    const fetchCourseGroupRanks = async () => {
      try {
        // Get all groups the student belongs to with course information
        const { data: studentGroups, error: groupsError } = await supabase
          .from('course_group_students')
          .select(`
            group_id,
            course_groups!inner(
              id,
              title,
              course_id
            )
          `)
          .eq('student_id', profile.id);

        if (groupsError) throw groupsError;

        if (!studentGroups || studentGroups.length === 0) {
          setCourseGroupRanks({});
          setLoading(false);
          return;
        }

        const courseGroupRanksMap: Record<string, CourseGroupRank[]> = {};

        // For each group, get the student's ranking
        for (const studentGroup of studentGroups) {
          const groupId = studentGroup.group_id;
          const group = studentGroup.course_groups as any;
          const courseId = group.course_id;

          // Get all students in this group
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

          if (groupError) {
            console.error('Error fetching group students:', groupError);
            continue;
          }

          // Get their points (if any)
          const { data: pointsData, error: pointsError } = await supabase
            .from('student_group_points')
            .select('student_id, points')
            .eq('group_id', groupId);

          if (pointsError) {
            console.error('Error fetching group points:', pointsError);
            continue;
          }

          // Create a map of student points
          const pointsMap = (pointsData || []).reduce((acc, item) => {
            acc[item.student_id] = item.points;
            return acc;
          }, {} as Record<string, number>);

          // Create leaderboard with all students (default to 0 points)
          const leaderboard = (groupStudents || [])
            .filter(item => item.profiles)
            .map((item) => ({
              student_id: item.student_id,
              points: pointsMap[item.student_id] || 0,
            }))
            .sort((a, b) => b.points - a.points);

          // Find student's rank and points in this group
          const studentRankIndex = leaderboard.findIndex(
            item => item.student_id === profile.id
          );

          let studentPoints = 0;
          let rank = 0;

          if (studentRankIndex >= 0) {
            studentPoints = leaderboard[studentRankIndex].points;
            rank = studentRankIndex + 1;
          } else {
            // Student not in group
            continue;
          }

          const courseGroupRank: CourseGroupRank = {
            courseId,
            groupId,
            groupTitle: group.title,
            rank,
            points: studentPoints,
            totalStudents: (groupStudents?.length || 0)
          };

          if (!courseGroupRanksMap[courseId]) {
            courseGroupRanksMap[courseId] = [];
          }
          courseGroupRanksMap[courseId].push(courseGroupRank);
        }

        setCourseGroupRanks(courseGroupRanksMap);
      } catch (error) {
        console.error('Error fetching course group ranks:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourseGroupRanks();
  }, [profile?.id]);

  return {
    courseGroupRanks,
    loading,
  };
};