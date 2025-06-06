
import { Button } from "@/components/ui/button";
import { Plus, UserPlus } from "lucide-react";
import { Link } from "react-router-dom";

interface AdminDashboardHeaderProps {
  onCreateCourse: () => void;
}

export const AdminDashboardHeader = ({ onCreateCourse }: AdminDashboardHeaderProps) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
      <div>
        <h1 className="text-3xl font-bold mb-1">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage your courses, groups and track progress</p>
      </div>
      <div className="flex gap-2">
        <Button 
          className="bg-academy-blue hover:bg-blue-600"
          onClick={onCreateCourse}
        >
          <Plus className="w-4 h-4 mr-2" /> Add Course
        </Button>
        <Button variant="outline" asChild>
          <Link to="/admin/groups">
            <UserPlus className="w-4 h-4 mr-2" /> Manage Groups
          </Link>
        </Button>
      </div>
    </div>
  );
};
