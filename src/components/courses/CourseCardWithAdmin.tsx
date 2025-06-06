
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Course } from "@/types/supabase";
import { Link } from "react-router-dom";

interface AdminCourseCardProps {
  course: Course;
}

export const AdminCourseCard = ({ course }: AdminCourseCardProps) => {
  return (
    <Card className="overflow-hidden">
      {course.image_url && (
        <div className="aspect-video overflow-hidden">
          <img 
            src={course.image_url} 
            alt={course.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <CardHeader className="bg-gradient-to-r from-academy-blue to-academy-orange p-4">
        <CardTitle className="text-white truncate">{course.title}</CardTitle>
        <CardDescription className="text-white/80">
          {course.total_sessions} {course.total_sessions === 1 ? 'session' : 'sessions'}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4">
        <p className="text-sm text-gray-600 mb-2 line-clamp-2 h-10">
          {course.description || "No description provided"}
        </p>
        <p className="text-xs text-gray-500">
          Created on {new Date(course.created_at).toLocaleDateString()}
        </p>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-end">
        <Button asChild>
          <Link to={`/admin/courses/${course.id}`}>Manage Course</Link>
        </Button>
      </CardFooter>
    </Card>
  );
};
