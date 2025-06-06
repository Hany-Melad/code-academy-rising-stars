import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useGroupLeaderboard } from "@/hooks/useGroupLeaderboard";

interface GroupLeaderboardProps {
  groupId: string;
  groupTitle: string;
}

export function GroupLeaderboard({ groupId, groupTitle }: GroupLeaderboardProps) {
  const { profile } = useAuth();
  const { students, loading } = useGroupLeaderboard(groupId);
  
  // Get top 5 students
  const topStudents = students.slice(0, 5);
  
  // Find current student's rank if not in top 5 and if current user is a student
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

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Group Leaderboard
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          {groupTitle} Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        {students.length === 0 ? (
          <div className="text-center py-8">
            <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No points earned yet in this group</p>
          </div>
        ) : (
          <div className="space-y-3">
            {topStudents.map((student) => {
              const isCurrentStudent = student.id === profile?.id;
              
              return (
                <div
                  key={student.id}
                  className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                    isCurrentStudent ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {getRankIcon(student.rank)}
                    <div>
                      <p className={`font-medium ${isCurrentStudent ? 'text-blue-900' : 'text-gray-900'}`}>
                        {student.name}
                        {isCurrentStudent && <span className="ml-2 text-xs text-blue-600">(You)</span>}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {student.points} group points
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getRankBadge(student.rank)}
                  </div>
                </div>
              );
            })}
            
            {/* Show current student's rank if not in top 5 and they are a student */}
            {currentStudentRank > 5 && currentStudent && profile?.role === 'student' && (
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
                          {currentStudent.points} group points
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
        )}
      </CardContent>
    </Card>
  );
}