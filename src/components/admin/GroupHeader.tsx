
import { Button } from "@/components/ui/button";
import { ArrowLeft, Book, UserPlus, MapPin, Calendar } from "lucide-react";
import { Link } from "react-router-dom";

interface CourseGroup {
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
    description: string | null;
  };
}

interface GroupHeaderProps {
  group: CourseGroup | null;
  onAddStudent: () => void;
}

export const GroupHeader = ({ group, onAddStudent }: GroupHeaderProps) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/admin/groups" className="flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" />
              Back to Groups
            </Link>
          </Button>
        </div>
        <h1 className="text-3xl font-bold">{group?.title}</h1>
        {group && (
          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
            <span className="flex items-center gap-1">
              <Book className="w-4 h-4" />
              {group.course?.title}
            </span>
            {group.branch && (
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {group.branch}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              Started {new Date(group.start_date).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <Button 
          onClick={onAddStudent}
          className="bg-academy-blue hover:bg-blue-600"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Add Student
        </Button>
      </div>
    </div>
  );
};
