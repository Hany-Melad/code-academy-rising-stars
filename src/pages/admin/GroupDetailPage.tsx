
import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useParams } from "react-router-dom";
import { AddStudentToGroupDialog } from "@/components/admin/AddStudentToGroupDialog";
import { GroupStudentsTab } from "@/components/admin/GroupStudentsTab";
import { GroupHeader } from "@/components/admin/GroupHeader";
import { GroupLeaderboard } from "@/components/admin/GroupLeaderboard";
import { GlobalSubscriptionDialog } from "@/components/admin/GlobalSubscriptionDialog";
import { useGroupData } from "@/hooks/useGroupData";

const GroupDetailPage = () => {
  const { groupId } = useParams();
  const { profile } = useAuth();
  const [openAddStudentDialog, setOpenAddStudentDialog] = useState(false);
  const [openSubscriptionDialog, setOpenSubscriptionDialog] = useState(false);
  
  const { group, students, loading, fetchGroupDetails } = useGroupData();

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

  const handleSubscriptionUpdated = () => {
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
              <GroupStudentsTab 
                students={students}
                groupId={groupId!}
                onStudentRemoved={handleStudentRemoved}
                onManageSubscriptions={() => setOpenSubscriptionDialog(true)}
              />
          </div>
          
          <div className="lg:col-span-1">
            <GroupLeaderboard 
              groupId={groupId!}
              groupTitle={group?.title || 'Group'}
            />
          </div>
        </div>
      </div>

      <AddStudentToGroupDialog
        open={openAddStudentDialog}
        onOpenChange={setOpenAddStudentDialog}
        groupId={groupId!}
        onStudentAdded={handleStudentAdded}
        enrolledStudentIds={students.map(s => s.id)}
      />

      <GlobalSubscriptionDialog
        open={openSubscriptionDialog}
        onOpenChange={setOpenSubscriptionDialog}
        onSubscriptionUpdated={handleSubscriptionUpdated}
      />
    </DashboardLayout>
  );
};

export default GroupDetailPage;
