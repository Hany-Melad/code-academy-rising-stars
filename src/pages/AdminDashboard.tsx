
import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { AdminDashboardHeader } from "@/components/admin/AdminDashboardHeader";
import { AdminStatsGrid } from "@/components/admin/AdminStatsGrid";
import { RecentStudentsSection } from "@/components/admin/RecentStudentsSection";
import { MyCoursesSection } from "@/components/admin/MyCoursesSection";
import { CreateCourseDialog } from "@/components/admin/CreateCourseDialog";
import { useAdminDashboardData } from "@/hooks/useAdminDashboardData";

const AdminDashboard = () => {
  const [openCourseDialog, setOpenCourseDialog] = useState(false);
  
  const { 
    courses, 
    students, 
    loading, 
    authLoading, 
    totalGroups, 
    refetchCourses 
  } = useAdminDashboardData();

  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[80vh]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-t-academy-blue border-r-transparent border-b-academy-orange border-l-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-lg text-gray-600">Loading dashboard data...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <AdminDashboardHeader onCreateCourse={() => setOpenCourseDialog(true)} />
        
        <AdminStatsGrid 
          coursesCount={courses.length}
          studentsCount={students.length}
          totalGroups={totalGroups}
          students={students}
        />
        
        <RecentStudentsSection students={students} />
        
        <MyCoursesSection courses={courses} />
      </div>

      <CreateCourseDialog
        open={openCourseDialog}
        onOpenChange={setOpenCourseDialog}
        onCourseCreated={refetchCourses}
      />
    </DashboardLayout>
  );
};

export default AdminDashboard;
