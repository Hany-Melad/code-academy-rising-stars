
import { Button } from "@/components/ui/button";
import { AdminCourseCard } from "@/components/courses/CourseCardWithAdmin";
import { Course } from "@/types/supabase";
import { Link } from "react-router-dom";

interface MyCoursesSectionProps {
  courses: Course[];
}

export const MyCoursesSection = ({ courses }: MyCoursesSectionProps) => {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">My Courses</h2>
        <Button variant="outline" asChild>
          <Link to="/admin/courses">View All</Link>
        </Button>
      </div>
      
      {courses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.slice(0, 3).map((course) => (
            <AdminCourseCard 
              key={course.id} 
              course={course}
            />
          ))}
        </div>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
          <h3 className="font-medium text-gray-900 mb-1">No courses yet</h3>
          <p className="text-gray-600">
            Create your first course to get started.
          </p>
        </div>
      )}
    </div>
  );
};
