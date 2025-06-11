import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface GroupRanking {
  groupId: string;
  groupTitle: string;
  rank: number;
  points: number;
  totalStudents: number;
}

export function GroupRankingsCard() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [groupRankings, setGroupRankings] = useState<GroupRanking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.id) return;

    const fetchGroupRankings = async () => {
      try {
        // Get all groups the student belongs to
        const { data: studentGroups, error: groupsError } = await supabase
          .from('course_group_students')
          .select(`
            group_id,
            course_groups!inner(
              id,
              title
            )
          `)
          .eq('student_id', profile.id);

        if (groupsError) throw groupsError;

        if (!studentGroups || studentGroups.length === 0) {
          setGroupRankings([]);
          setLoading(false);
          return;
        }

        const rankings: GroupRanking[] = [];

        // For each group, get the student's ranking
        for (const studentGroup of studentGroups) {
          const groupId = studentGroup.group_id;
          const group = studentGroup.course_groups as any;

          // Get all students in this group with their points, ordered by points
          const { data: groupLeaderboard, error: leaderboardError } = await supabase
            .from('student_group_points')
            .select(`
              student_id,
              points,
              profiles!student_group_points_student_id_fkey(
                id,
                name
              )
            `)
            .eq('group_id', groupId)
            .order('points', { ascending: false });

          if (leaderboardError) {
            console.error('Error fetching group leaderboard:', leaderboardError);
            continue;
          }

          // Find student's rank and points in this group
          const studentRankIndex = (groupLeaderboard || []).findIndex(
            item => item.student_id === profile.id
          );

          let studentPoints = 0;
          let rank = 0;

          if (studentRankIndex >= 0) {
            studentPoints = groupLeaderboard[studentRankIndex].points;
            rank = studentRankIndex + 1;
          } else {
            // Student not in points table yet, rank is last
            rank = (groupLeaderboard?.length || 0) + 1;
          }

          rankings.push({
            groupId,
            groupTitle: group.title,
            rank,
            points: studentPoints,
            totalStudents: (groupLeaderboard?.length || 0)
          });
        }

        setGroupRankings(rankings);
      } catch (error) {
        console.error('Error fetching group rankings:', error);
        toast({
          title: "Error",
          description: "Failed to load group rankings",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchGroupRankings();
  }, [profile?.id, toast]);

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">1st</Badge>;
      case 2:
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">2nd</Badge>;
      case 3:
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">3rd</Badge>;
      default:
        return <Badge variant="outline">{rank}th</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Group Rankings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-4 border-t-academy-blue border-r-transparent border-b-academy-orange border-l-transparent rounded-full animate-spin"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (groupRankings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Group Rankings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">You're not in any groups yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Group Rankings
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {groupRankings.map((ranking) => (
            <div
              key={ranking.groupId}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
            >
              <div className="flex items-center gap-3">
                <Trophy className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm">{ranking.groupTitle}</p>
                  <p className="text-xs text-muted-foreground">
                    {ranking.points} points • {ranking.totalStudents} students
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getRankBadge(ranking.rank)}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}