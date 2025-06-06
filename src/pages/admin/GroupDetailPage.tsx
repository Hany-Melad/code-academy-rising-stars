
import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useParams } from "react-router-dom";
import { AddStudentToGroupDialog } from "@/components/admin/AddStudentToGroupDialog";
import { GroupStudentsTab } from "@/components/admin/GroupStudentsTab";
import { GroupHeader } from "@/components/admin/GroupHeader";
import { useGroupData } from "@/hooks/useGroupData";
import { useGroupManagement } from "@/hooks/useGroupManagement";

const GroupDetailPage = () => {
  const { groupId } = useParams();
  const { profile } = useAuth();
  const [openAddStudentDialog, setOpenAddStudentDialog] = useState(false);
  
  const { group, students, loading, fetchGroupDetails } = useGroupData();
  const { handleAddSessions, handleRemoveSessions } = useGroupManagement();

  const handleAddSessionsWrapper = async (studentId: string, sessions: number) => {
    const success = await handleAddSessions(studentId, sessions, group?.title);
    if (success && profile && groupId) {
      await fetchGroupDetails(groupId, profile.id);
    }
  };

  const handleRemoveSessionsWrapper = async (studentId: string, sessions: number) => {
    const success = await handleRemoveSessions(studentId, sessions, group?.title);
    if (success && profile && groupId) {
      await fetchGroupDetails(groupId, profile.id);
    }
  };

  const handleStudentAdded = () => {
    if (profile && groupId) {
      fetchGroupDetails(groupId, profile.id);
    }
  };

  const handleStudentRemoved = () => {
    if (profile && groupId) {
      fetchGroupDetails(groupId, profile.id);
    }
  };

  useEffect(() => {
    if (profile && groupId) {
      fetchGroupDetails(groupId, profile.id);
    }
  }, [groupId, profile]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[80vh]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-t-academy-blue border-r-transparent border-b-academy-orange border-l-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-lg text-gray-600">Loading group details...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <GroupHeader 
          group={group} 
          onAddStudent={() => setOpenAddStudentDialog(true)} 
        />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Students ({students.length})</h2>
          </div>
          
          <GroupStudentsTab 
            students={students}
            groupId={groupId!}
            onAddSessions={handleAddSessionsWrapper}
            onRemoveSessions={handleRemoveSessionsWrapper}
            onStudentRemoved={handleStudentRemoved}
          />
        </div>
      </div>

      <AddStudentToGroupDialog
        open={openAddStudentDialog}
        onOpenChange={setOpenAddStudentDialog}
        groupId={groupId!}
        onStudentAdded={handleStudentAdded}
        enrolledStudentIds={students.map(s => s.id)}
      />
    </DashboardLayout>
  );
};

export default GroupDetailPage;
