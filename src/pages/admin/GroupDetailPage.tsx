
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Plus, Minus, Eye, EyeOff, AlertTriangle, UserPlus } from "lucide-react";
import { AddStudentToGroupDialog } from "@/components/admin/AddStudentToGroupDialog";

interface GroupStudent {
  id: string;
  student: {
    id: string;
    name: string;
    unique_id: string | null;
  };
  student_course: {
    id: string;
    hide_new_sessions: boolean;
  };
  subscription: {
    id: string;
    total_sessions: number;
    remaining_sessions: number;
    warning: boolean;
  } | null;
}

interface GroupDetail {
  id: string;
  title: string;
  branch: string | null;
  start_date: string;
  course: {
    id: string;
    title: string;
    description: string | null;
  };
  creator: {
    name: string;
  };
}

const GroupDetailPage = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const { profile } = useAuth();
  const { toast } = useToast();
  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [students, setStudents] = useState<GroupStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [openAddDialog, setOpenAddDialog] = useState(false);

  const fetchGroupData = async () => {
    if (!groupId || !profile) return;
    
    try {
      setLoading(true);
      
      // Fetch group details
      const { data: groupData, error: groupError } = await supabase
        .from('course_groups')
        .select(`
          *,
          course:courses(id, title, description),
          creator:profiles!course_groups_created_by_fkey(name)
        `)
        .eq('id', groupId)
        .or(`created_by.eq.${profile.id},allowed_admin_id.eq.${profile.id}`)
        .single();

      if (groupError) throw groupError;
      
      setGroup(groupData);

      // Fetch students in group with their subscriptions
      const { data: studentsData, error: studentsError } = await supabase
        .from('course_group_students')
        .select(`
          id,
          student:profiles!course_group_students_student_id_fkey(id, name, unique_id),
          student_course:student_courses!course_group_students_student_course_id_fkey(id, hide_new_sessions)
        `)
        .eq('group_id', groupId);

      if (studentsError) throw studentsError;

      // Fetch subscriptions for each student
      const studentsWithSubscriptions = await Promise.all(
        (studentsData || []).map(async (student) => {
          const { data: subscription } = await supabase
            .from('student_course_subscription')
            .select('*')
            .eq('student_course_id', student.student_course.id)
            .maybeSingle();

          return {
            ...student,
            subscription
          };
        })
      );

      setStudents(studentsWithSubscriptions);
    } catch (error) {
      console.error('Error fetching group data:', error);
      toast({
        title: "Error",
        description: "Failed to load group data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroupData();
  }, [groupId, profile]);

  const updateSessions = async (studentCourseId: string, change: number) => {
    try {
      const { data: subscription, error: fetchError } = await supabase
        .from('student_course_subscription')
        .select('*')
        .eq('student_course_id', studentCourseId)
        .single();

      if (fetchError) throw fetchError;

      const newRemaining = Math.max(0, subscription.remaining_sessions + change);
      const newTotal = Math.max(newRemaining, subscription.total_sessions + change);

      const { error: updateError } = await supabase
        .from('student_course_subscription')
        .update({
          remaining_sessions: newRemaining,
          total_sessions: newTotal,
          warning: newRemaining <= 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', subscription.id);

      if (updateError) throw updateError;

      toast({
        title: "Sessions updated",
        description: `Sessions ${change > 0 ? 'added' : 'removed'} successfully`,
      });

      fetchGroupData();
    } catch (error) {
      console.error('Error updating sessions:', error);
      toast({
        title: "Error",
        description: "Failed to update sessions",
        variant: "destructive",
      });
    }
  };

  const toggleCourseVisibility = async (studentCourseId: string, currentlyHidden: boolean) => {
    try {
      const { error } = await supabase
        .from('student_courses')
        .update({
          hide_new_sessions: !currentlyHidden
        })
        .eq('id', studentCourseId);

      if (error) throw error;

      toast({
        title: currentlyHidden ? "Course shown" : "Course hidden",
        description: `Course is now ${currentlyHidden ? 'visible' : 'hidden'} for the student`,
      });

      fetchGroupData();
    } catch (error) {
      console.error('Error toggling course visibility:', error);
      toast({
        title: "Error",
        description: "Failed to update course visibility",
        variant: "destructive",
      });
    }
  };

  const bulkUpdateSessions = async (change: number) => {
    try {
      const updates = students.map(async (student) => {
        if (student.subscription) {
          const newRemaining = Math.max(0, student.subscription.remaining_sessions + change);
          const newTotal = Math.max(newRemaining, student.subscription.total_sessions + change);

          return supabase
            .from('student_course_subscription')
            .update({
              remaining_sessions: newRemaining,
              total_sessions: newTotal,
              warning: newRemaining <= 1,
              updated_at: new Date().toISOString()
            })
            .eq('id', student.subscription.id);
        }
      });

      await Promise.all(updates);

      toast({
        title: "Bulk update completed",
        description: `Sessions ${change > 0 ? 'added' : 'removed'} for all students`,
      });

      fetchGroupData();
    } catch (error) {
      console.error('Error bulk updating sessions:', error);
      toast({
        title: "Error",
        description: "Failed to bulk update sessions",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[80vh]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-t-academy-blue border-r-transparent border-b-academy-orange border-l-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-lg text-gray-600">Loading group data...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!group) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Group not found</h2>
          <p className="text-gray-600 mb-4">The group you're looking for doesn't exist or you don't have permission to view it.</p>
          <Button asChild>
            <Link to="/admin/groups">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Groups
            </Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link to="/admin/groups">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{group.title}</h1>
            <p className="text-muted-foreground">
              {group.course.title} • Started {new Date(group.start_date).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Group Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={() => setOpenAddDialog(true)}
                className="w-full"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Add Student
              </Button>
              
              <Button 
                onClick={() => bulkUpdateSessions(1)}
                variant="outline"
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Session to All
              </Button>
              
              <Button 
                onClick={() => bulkUpdateSessions(-1)}
                variant="outline"
                className="w-full"
              >
                <Minus className="w-4 h-4 mr-2" />
                Remove Session from All
              </Button>
            </CardContent>
          </Card>

          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Students ({students.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {students.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>ID</TableHead>
                      <TableHead>Total Sessions</TableHead>
                      <TableHead>Remaining</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">
                          {student.student.name}
                        </TableCell>
                        <TableCell>
                          {student.student.unique_id || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {student.subscription?.total_sessions || 0}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {student.subscription?.remaining_sessions || 0}
                            {student.subscription?.warning && (
                              <AlertTriangle className="w-4 h-4 text-amber-500" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {student.student_course.hide_new_sessions && (
                              <Badge variant="destructive">Hidden</Badge>
                            )}
                            {student.subscription?.warning && (
                              <Badge variant="outline" className="text-amber-600 border-amber-200">
                                Low Sessions
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateSessions(student.student_course.id, 1)}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateSessions(student.student_course.id, -1)}
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => toggleCourseVisibility(
                                student.student_course.id, 
                                student.student_course.hide_new_sessions
                              )}
                            >
                              {student.student_course.hide_new_sessions ? (
                                <Eye className="w-3 h-3" />
                              ) : (
                                <EyeOff className="w-3 h-3" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <UserPlus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="font-medium text-gray-900 mb-2">No students yet</h3>
                  <p className="text-gray-600 mb-4">Add students to this group to get started.</p>
                  <Button onClick={() => setOpenAddDialog(true)}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add First Student
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <AddStudentToGroupDialog
        open={openAddDialog}
        onOpenChange={setOpenAddDialog}
        groupId={groupId!}
        courseId={group.course.id}
        onStudentAdded={fetchGroupData}
      />
    </DashboardLayout>
  );
};

export default GroupDetailPage;
