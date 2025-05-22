
import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { supabase, ensureValidRole } from "@/lib/supabase";
import { Profile } from "@/types/supabase";
import { useToast } from "@/components/ui/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

const LeaderboardPage = () => {
  const { toast } = useToast();
  const [students, setStudents] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboardData = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'student')
          .order('total_points', { ascending: false })
          .limit(50);
        
        if (error) throw error;
        
        // Ensure correct typing for roles
        const typedStudents = (data || []).map(student => ({
          ...student,
          role: ensureValidRole(student.role)
        }));
        
        setStudents(typedStudents);
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
        toast({
          title: "Error",
          description: "Failed to load leaderboard data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchLeaderboardData();
  }, [toast]);

  const getTrophyIcon = (position: number) => {
    if (position === 0) {
      return <Trophy className="h-6 w-6 text-yellow-500" />;
    } else if (position === 1) {
      return <Trophy className="h-6 w-6 text-gray-400" />;
    } else if (position === 2) {
      return <Trophy className="h-6 w-6 text-amber-700" />;
    }
    return null;
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-1">Leaderboard</h1>
          <p className="text-muted-foreground">See where you rank among other students</p>
        </div>
        
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* Top 3 students highlight */}
          {students.length > 0 && (
            <div className="bg-gradient-to-r from-academy-orange to-academy-blue p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Second place */}
                {students.length > 1 && (
                  <div className="flex flex-col items-center text-white order-1 md:order-0">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center">
                        <Avatar className="w-20 h-20 border-4 border-white">
                          <AvatarImage 
                            src={`https://api.dicebear.com/7.x/initials/svg?seed=${students[1].name}`} 
                            alt={students[1].name} 
                          />
                          <AvatarFallback>{students[1].name.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="absolute -bottom-2 -right-2 bg-gray-400 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold shadow-md">
                        2
                      </div>
                    </div>
                    <h3 className="mt-4 font-semibold text-lg">{students[1].name}</h3>
                    <p className="text-white/80">{students[1].total_points} pts</p>
                  </div>
                )}
                
                {/* First place */}
                <div className="flex flex-col items-center text-white order-0 md:order-1 scale-110">
                  <div className="relative">
                    <div className="w-28 h-28 rounded-full bg-white/30 flex items-center justify-center">
                      <Avatar className="w-24 h-24 border-4 border-yellow-300">
                        <AvatarImage 
                          src={`https://api.dicebear.com/7.x/initials/svg?seed=${students[0].name}`} 
                          alt={students[0].name} 
                        />
                        <AvatarFallback>{students[0].name.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-yellow-500 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shadow-md">
                      1
                    </div>
                  </div>
                  <h3 className="mt-4 font-bold text-xl">{students[0].name}</h3>
                  <p className="text-white/90 font-semibold">{students[0].total_points} pts</p>
                </div>
                
                {/* Third place */}
                {students.length > 2 && (
                  <div className="flex flex-col items-center text-white order-2">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center">
                        <Avatar className="w-20 h-20 border-4 border-white">
                          <AvatarImage 
                            src={`https://api.dicebear.com/7.x/initials/svg?seed=${students[2].name}`} 
                            alt={students[2].name} 
                          />
                          <AvatarFallback>{students[2].name.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="absolute -bottom-2 -right-2 bg-amber-700 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold shadow-md">
                        3
                      </div>
                    </div>
                    <h3 className="mt-4 font-semibold text-lg">{students[2].name}</h3>
                    <p className="text-white/80">{students[2].total_points} pts</p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Full leaderboard */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">Rank</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Points</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.slice(0, 50).map((student, index) => (
                  <tr key={student.id} className={cn("hover:bg-gray-50", {
                    "bg-yellow-50": index === 0,
                    "bg-gray-50": index === 1,
                    "bg-amber-50": index === 2,
                  })}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-center">
                        {index < 3 ? (
                          getTrophyIcon(index)
                        ) : (
                          <span className="font-medium text-gray-900">{index + 1}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Avatar className="h-8 w-8 mr-3">
                          <AvatarImage 
                            src={`https://api.dicebear.com/7.x/initials/svg?seed=${student.name}`} 
                            alt={student.name} 
                          />
                          <AvatarFallback>{student.name.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="text-sm font-medium text-gray-900">{student.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{student.unique_id || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-academy-orange">{student.total_points} points</div>
                    </td>
                  </tr>
                ))}
                
                {students.length === 0 && !loading && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center">
                      <p className="text-gray-500">No students found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default LeaderboardPage;
