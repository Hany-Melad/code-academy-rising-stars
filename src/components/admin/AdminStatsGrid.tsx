
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Book, Users, UserPlus } from "lucide-react";
import { Profile } from "@/types/supabase";

interface AdminStatsGridProps {
  coursesCount: number;
  studentsCount: number;
  totalGroups: number;
  students: Profile[];
}

export const AdminStatsGrid = ({ 
  coursesCount, 
  studentsCount, 
  totalGroups, 
  students 
}: AdminStatsGridProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatsCard 
        title="My Courses"
        value={coursesCount}
        icon={Book}
        colorVariant="blue"
      />
      <StatsCard 
        title="Total Students"
        value={studentsCount}
        icon={Users}
        colorVariant="orange"
      />
      <StatsCard 
        title="My Groups"
        value={totalGroups}
        icon={UserPlus}
        colorVariant="purple"
      />
      <StatsCard 
        title="Active Students"
        value={students.filter(s => s.total_points > 0).length}
        icon={Users}
        description="Students with activity"
        colorVariant="green"
      />
    </div>
  );
};
