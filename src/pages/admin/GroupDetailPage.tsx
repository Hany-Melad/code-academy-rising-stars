import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Book, UserPlus, MapPin, Calendar } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { AddStudentToGroupDialog } from "@/components/admin/AddStudentToGroupDialog";
import { GroupStudentsTab } from "@/components/admin/GroupStudentsTab";

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

interface Student {
  id: string;
  name: string;
  unique_id: string | null;
  total_points: number;
  remaining_sessions: number;
  total_sessions: number;
}

const GroupDetailPage = () => {
  const { groupId } = useParams();
  const { profile } = useAuth();
  const { toast } = useToast();
  const [group, setGroup] = useState<CourseGroup | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [openAddStudentDialog, setOpenAddStudentDialog] = useState(false);

  const getStudentGlobalSubscription = async (studentId: string) => {
    console.log('Getting global subscription for student:', studentId);
    
    // Get any student course for this student to find their global subscription
    const { data: studentCourses, error: coursesError } = await supabase
      .from('student_courses')
      .select('id')
      .eq('student_id', studentId)
      .limit(1);

    console.log('Student courses for subscription check:', { studentCourses, coursesError });

    if (!studentCourses || studentCourses.length === 0) {
      console.log('No student courses found for subscription');
      return { remaining_sessions: 0, total_sessions: 0 };
    }

    const { data: subscription, error: subError } = await supabase
      .from('student_course_subscription')
      .select('*')
      .eq('student_course_id', studentCourses[0].id)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    console.log('Subscription data:', { subscription, subError });

    if (!subscription) {
      console.log('No subscription found');
      return { remaining_sessions: 0, total_sessions: 0 };
    }

    return {
      remaining_sessions: subscription.remaining_sessions,
      total_sessions: subscription.total_sessions,
      subscription_id: subscription.id
    };
  };

  const updateStudentGlobalSubscription = async (studentId: string, newRemainingSessions: number, newTotalSessions: number) => {
    console.log('Updating global subscription:', { studentId, newRemainingSessions, newTotalSessions });
    
    // Get all student courses for this student
    const { data: studentCourses } = await supabase
      .from('student_courses')
      .select('id')
      .eq('student_id', studentId);

    if (!studentCourses || studentCourses.length === 0) {
      throw new Error('Student course not found');
    }

    const newPlanDurationMonths = Math.ceil(newTotalSessions / 4);

    // Update all subscriptions for this student across all courses
    for (const studentCourse of studentCourses) {
      // Delete any duplicate subscriptions first
      const { data: existingSubscriptions } = await supabase
        .from('student_course_subscription')
        .select('id')
        .eq('student_course_id', studentCourse.id)
        .order('updated_at', { ascending: false });

      if (existingSubscriptions && existingSubscriptions.length > 1) {
        // Keep the latest one, delete the rest
        const subscriptionsToDelete = existingSubscriptions.slice(1);
        for (const sub of subscriptionsToDelete) {
          await supabase
            .from('student_course_subscription')
            .delete()
            .eq('id', sub.id);
        }
      }

      // Update or create subscription
      const { error } = await supabase
        .from('student_course_subscription')
        .upsert({
          student_course_id: studentCourse.id,
          plan_duration_months: newPlanDurationMonths,
          total_sessions: newTotalSessions,
          remaining_sessions: newRemainingSessions,
          warning: newRemainingSessions <= 2,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Error updating subscription for course:', studentCourse.id, error);
        throw error;
      }
    }

    console.log('Successfully updated global subscription');
  };

  const handleAddSessions = async (studentId: string, sessions: number) => {
    try {
      console.log('Adding sessions to student:', studentId, sessions);
      const currentSubscription = await getStudentGlobalSubscription(studentId);
      
      const newTotalSessions = currentSubscription.total_sessions + sessions;
      const newRemainingSessions = currentSubscription.remaining_sessions + sessions;

      await updateStudentGlobalSubscription(studentId, newRemainingSessions, newTotalSessions);

      // Create notification with group name
      await supabase
        .from('student_notifications')
        .insert({
          student_id: studentId,
          title: 'Sessions Added',
          message: `${sessions} session${sessions !== 1 ? 's' : ''} added to your global subscription from group "${group?.title}". You now have ${newRemainingSessions} sessions remaining.`,
          notification_type: 'session_update',
        });

      toast({
        title: "Sessions added",
        description: `${sessions} session${sessions !== 1 ? 's' : ''} added successfully`,
      });

      // Refresh data to show updated sessions across all groups
      await fetchGroupDetails();
    } catch (error) {
      console.error('Error adding sessions:', error);
      toast({
        title: "Error",
        description: "Failed to add sessions",
        variant: "destructive",
      });
    }
  };

  const handleRemoveSessions = async (studentId: string, sessions: number) => {
    try {
      console.log('Removing sessions from student:', studentId, sessions);
      const currentSubscription = await getStudentGlobalSubscription(studentId);
      
      const newTotalSessions = Math.max(0, currentSubscription.total_sessions - sessions);
      const newRemainingSessions = Math.max(0, currentSubscription.remaining_sessions - sessions);

      await updateStudentGlobalSubscription(studentId, newRemainingSessions, newTotalSessions);

      // Create notification with group name
      await supabase
        .from('student_notifications')
        .insert({
          student_id: studentId,
          title: 'Sessions Removed',
          message: `${sessions} session${sessions !== 1 ? 's' : ''} removed from your global subscription in group "${group?.title}". You now have ${newRemainingSessions} sessions remaining.`,
          notification_type: 'session_update',
        });

      toast({
        title: "Sessions removed",
        description: `${sessions} session${sessions !== 1 ? 's' : ''} removed successfully`,
      });

      // Refresh data to show updated sessions across all groups
      await fetchGroupDetails();
    } catch (error) {
      console.error('Error removing sessions:', error);
      toast({
        title: "Error",
        description: "Failed to remove sessions",
        variant: "destructive",
      });
    }
  };

  const fetchGroupDetails = async () => {
    if (!profile || !groupId) return;

    try {
      setLoading(true);
      console.log('Fetching group details for:', groupId);

      // Fetch group details
      const { data: groupData, error: groupError } = await supabase
        .from('course_groups')
        .select(`
          *,
          course:courses(id, title, description)
        `)
        .eq('id', groupId)
        .single();

      if (groupError) {
        console.error('Error fetching group:', groupError);
        throw groupError;
      }
      
      console.log('Group data:', groupData);
      setGroup(groupData);

      // Fetch students in the group
      const { data: studentsData, error: studentsError } = await supabase
        .from('course_group_students')
        .select(`
          student:profiles (
            id,
            name,
            unique_id,
            total_points
          )
        `)
        .eq('group_id', groupId);

      if (studentsError) {
        console.error('Error fetching students:', studentsError);
        throw studentsError;
      }

      console.log('Students data:', studentsData);

      // Fetch global subscription details for each student
      const studentsWithSessions = await Promise.all(
        studentsData.map(async (item) => {
          console.log('Processing student:', item.student);
          const subscriptionData = await getStudentGlobalSubscription(item.student.id);
          
          return {
            ...item.student,
            remaining_sessions: subscriptionData.remaining_sessions,
            total_sessions: subscriptionData.total_sessions,
          };
        })
      );

      console.log('Students with sessions:', studentsWithSessions);
      setStudents(studentsWithSessions as Student[]);
    } catch (error) {
      console.error('Error fetching group details:', error);
      toast({
        title: "Error",
        description: "Failed to load group details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStudentAdded = () => {
    fetchGroupDetails();
  };

  useEffect(() => {
    fetchGroupDetails();
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
              onClick={() => setOpenAddStudentDialog(true)}
              className="bg-academy-blue hover:bg-blue-600"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Add Student
            </Button>
          </div>
        </div>

        {/* Students Tab */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Students ({students.length})</h2>
          </div>
          
          <GroupStudentsTab 
            students={students}
            groupId={groupId!}
            onAddSessions={handleAddSessions}
            onRemoveSessions={handleRemoveSessions}
            onStudentRemoved={fetchGroupDetails}
          />
        </div>
      </div>

      <AddStudentToGroupDialog
        open={openAddStudentDialog}
        onOpenChange={setOpenAddStudentDialog}
        groupId={groupId!}
        courseId={group?.course.id || ''}
        onStudentAdded={handleStudentAdded}
      />
    </DashboardLayout>
  );
};

export default GroupDetailPage;
