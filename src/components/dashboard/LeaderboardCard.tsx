
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award } from "lucide-react";
import { Profile } from "@/types/supabase";
import { useAuth } from "@/contexts/AuthContext";

interface LeaderboardCardProps {
  students: Profile[];
}

export function LeaderboardCard({ students }: LeaderboardCardProps) {
  const { profile } = useAuth();
  
  // Get top 5 students
  const topStudents = students.slice(0, 5);
  
  // Find current student's rank if not in top 5
  const currentStudentRank = students.findIndex(student => student.id === profile?.id) + 1;
  const currentStudent = students.find(student => student.id === profile?.id);
  
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-4 w-4 text-yellow-500" />;
      case 2:
        return <Medal className="h-4 w-4 text-gray-400" />;
      case 3:
        return <Award className="h-4 w-4 text-amber-600" />;
      default:
        return null;
    }
  };

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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Top Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {topStudents.map((student, index) => {
            const rank = index + 1;
            const isCurrentStudent = student.id === profile?.id;
            
            return (
              <div
                key={student.id}
                className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                  isCurrentStudent ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  {getRankIcon(rank)}
                  <div>
                    <p className={`font-medium ${isCurrentStudent ? 'text-blue-900' : 'text-gray-900'}`}>
                      {student.name}
                      {isCurrentStudent && <span className="ml-2 text-xs text-blue-600">(You)</span>}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {student.total_points} points
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getRankBadge(rank)}
                </div>
              </div>
            );
          })}
          
          {/* Show current student's rank if not in top 5 */}
          {currentStudentRank > 5 && currentStudent && (
            <>
              <div className="border-t pt-3 mt-3">
                <p className="text-xs text-muted-foreground mb-2">Your Position:</p>
                <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 border border-blue-200">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-medium text-blue-900">
                        {currentStudent.name}
                        <span className="ml-2 text-xs text-blue-600">(You)</span>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {currentStudent.total_points} points
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getRankBadge(currentStudentRank)}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
