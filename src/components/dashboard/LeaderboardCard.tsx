
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy } from "lucide-react";
import { Profile } from "@/types/supabase";
import { cn } from "@/lib/utils";

interface LeaderboardCardProps {
  students: Profile[];
  limit?: number;
  className?: string;
}

export function LeaderboardCard({ students, limit = 5, className }: LeaderboardCardProps) {
  const sortedStudents = [...students]
    .sort((a, b) => b.total_points - a.total_points)
    .slice(0, limit);

  const getTrophyColor = (index: number) => {
    switch (index) {
      case 0:
        return "text-yellow-500";
      case 1:
        return "text-gray-400";
      case 2:
        return "text-amber-700";
      default:
        return "text-gray-300";
    }
  };

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <Trophy className="h-5 w-5 text-academy-orange" /> Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {sortedStudents.map((student, index) => (
            <li key={student.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-6">
                  {index < 3 ? (
                    <Trophy className={cn("h-5 w-5", getTrophyColor(index))} />
                  ) : (
                    <span className="text-sm font-semibold text-gray-500">{index + 1}</span>
                  )}
                </div>
                <Avatar className="h-8 w-8">
                  <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${student.name}`} alt={student.name} />
                  <AvatarFallback>{student.name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="font-medium">{student.name}</span>
              </div>
              <div className="flex items-center">
                <span className="font-bold text-academy-orange">{student.total_points}</span>
                <span className="text-xs text-gray-500 ml-1">pts</span>
              </div>
            </li>
          ))}
          
          {sortedStudents.length === 0 && (
            <div className="text-center py-4 text-gray-500">
              No students to display
            </div>
          )}
        </ul>
      </CardContent>
    </Card>
  );
}
