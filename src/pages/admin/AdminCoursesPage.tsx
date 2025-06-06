
import { DashboardLayout } from "@/components/DashboardLayout";
import { AdminCourseCard } from "@/components/courses/CourseCardWithAdmin";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import { CreateCourseDialog } from "@/components/admin/CreateCourseDialog";
import { useAdminDashboardData } from "@/hooks/useAdminDashboardData";

const AdminCoursesPage = () => {
  const [openCourseDialog, setOpenCourseDialog] = useState(false);
  const { courses, loading, refetchCourses } = useAdminDashboardData();

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[80vh]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-t-academy-blue border-r-transparent border-b-academy-orange border-l-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-lg text-gray-600">Loading courses...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-1">All Courses</h1>
            <p className="text-muted-foreground">Manage all your courses</p>
          </div>
          <Button onClick={() => setOpenCourseDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Course
          </Button>
        </div>

        {courses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <AdminCourseCard key={course.id} course={course} />
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
            <h3 className="font-medium text-gray-900 mb-2">No courses yet</h3>
            <p className="text-gray-600 mb-4">
              Create your first course to get started.
            </p>
            <Button onClick={() => setOpenCourseDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create First Course
            </Button>
          </div>
        )}
      </div>

      <CreateCourseDialog
        open={openCourseDialog}
        onOpenChange={setOpenCourseDialog}
        onCourseCreated={refetchCourses}
      />
    </DashboardLayout>
  );
};

export default AdminCoursesPage;
