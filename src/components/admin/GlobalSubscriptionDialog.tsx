import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/lib/supabase";
import { Search, Users, Plus, Minus } from "lucide-react";

interface Student {
  id: string;
  name: string;
  unique_id: string | null;
  email: string;
}

interface GlobalSubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubscriptionUpdated: () => void;
}

export function GlobalSubscriptionDialog({
  open,
  onOpenChange,
  onSubscriptionUpdated,
}: GlobalSubscriptionDialogProps) {
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [planDurationMonths, setPlanDurationMonths] = useState("");
  const [sessionAdjustment, setSessionAdjustment] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, unique_id, email')
        .eq('role', 'student')
        .order('name');

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const updateAllStudentSubscriptions = async (studentId: string, totalSessions: number, remainingSessions: number, planDurationMonths: number) => {
    console.log('Updating all subscriptions for student:', studentId);
    
    // Get all student courses for this student
    const { data: studentCourses } = await supabase
      .from('student_courses')
      .select('id')
      .eq('student_id', studentId);

    if (!studentCourses || studentCourses.length === 0) {
      // Create a default student course if none exist
      const { data: courses } = await supabase
        .from('courses')
        .select('id')
        .limit(1);

      if (courses && courses.length > 0) {
        const { error: courseError } = await supabase
          .from('student_courses')
          .insert({
            student_id: studentId,
            course_id: courses[0].id,
            progress: 0,
          });

        if (courseError) {
          console.error('Error creating student course:', courseError);
          throw courseError;
        }

        // Refetch student courses
        const { data: newStudentCourses } = await supabase
          .from('student_courses')
          .select('id')
          .eq('student_id', studentId);

        if (newStudentCourses) {
          for (const studentCourse of newStudentCourses) {
            await supabase
              .from('student_course_subscription')
              .upsert({
                student_course_id: studentCourse.id,
                plan_duration_months: planDurationMonths,
                total_sessions: totalSessions,
                remaining_sessions: remainingSessions,
                warning: remainingSessions <= 2,
                updated_at: new Date().toISOString(),
              });
          }
        }
      }
      return;
    }

    // Update all existing subscriptions for this student
    for (const studentCourse of studentCourses) {
      // Clean up any duplicate subscriptions first
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

      const { error } = await supabase
        .from('student_course_subscription')
        .upsert({
          student_course_id: studentCourse.id,
          plan_duration_months: planDurationMonths,
          total_sessions: totalSessions,
          remaining_sessions: remainingSessions,
          warning: remainingSessions <= 2,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Error updating subscription for course:', studentCourse.id, error);
        throw error;
      }
    }

    console.log('Successfully updated all subscriptions for student');
  };

  const handleStudentToggle = (studentId: string, checked: boolean) => {
    if (checked) {
      setSelectedStudents(prev => [...prev, studentId]);
    } else {
      setSelectedStudents(prev => prev.filter(id => id !== studentId));
    }
  };

  const handleSelectAll = () => {
    if (selectedStudents.length === filteredStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredStudents.map(s => s.id));
    }
  };

  const handleBulkCreateSubscription = async () => {
    if (selectedStudents.length === 0 || !planDurationMonths) return;

    try {
      setLoading(true);
      console.log('Creating bulk subscription for students:', selectedStudents);

      const duration = parseInt(planDurationMonths);
      if (isNaN(duration) || duration <= 0) {
        toast({
          title: "Error",
          description: "Please enter a valid number of months",
          variant: "destructive",
        });
        return;
      }

      const totalSessions = duration * 4;
      console.log('Creating subscription with:', { duration, totalSessions });

      // Process each selected student
      for (const studentId of selectedStudents) {
        await updateAllStudentSubscriptions(studentId, totalSessions, totalSessions, duration);

        // Create notification for each student
        await supabase
          .from('student_notifications')
          .insert({
            student_id: studentId,
            title: 'Subscription Created',
            message: `A new ${duration}-month subscription with ${totalSessions} sessions has been created for you.`,
            notification_type: 'subscription_change',
          });
      }

      toast({
        title: "Success",
        description: `Subscription created for ${selectedStudents.length} student${selectedStudents.length !== 1 ? 's' : ''} with ${totalSessions} sessions each`,
      });

      setSelectedStudents([]);
      setPlanDurationMonths("");
      onSubscriptionUpdated();
    } catch (error) {
      console.error('Error creating bulk subscription:', error);
      toast({
        title: "Error",
        description: "Failed to create subscription",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBulkSessionAdjustment = async (type: 'add' | 'remove') => {
    if (selectedStudents.length === 0 || !sessionAdjustment) return;

    try {
      setLoading(true);
      const adjustment = parseInt(sessionAdjustment);
      
      if (isNaN(adjustment) || adjustment <= 0) {
        toast({
          title: "Error",
          description: "Please enter a valid number of sessions",
          variant: "destructive",
        });
        return;
      }

      // Process each selected student
      for (const studentId of selectedStudents) {
        // Get current subscription for this student
        const { data: studentCourses } = await supabase
          .from('student_courses')
          .select('id')
          .eq('student_id', studentId)
          .limit(1);

        if (!studentCourses || studentCourses.length === 0) continue;

        const { data: subscription } = await supabase
          .from('student_course_subscription')
          .select('*')
          .eq('student_course_id', studentCourses[0].id)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!subscription) continue;

        let newRemainingSessions, newTotalSessions;
        
        if (type === 'add') {
          newTotalSessions = subscription.total_sessions + adjustment;
          newRemainingSessions = subscription.remaining_sessions + adjustment;
        } else {
          newTotalSessions = Math.max(0, subscription.total_sessions - adjustment);
          newRemainingSessions = Math.max(0, subscription.remaining_sessions - adjustment);
        }

        const newPlanDurationMonths = Math.ceil(newTotalSessions / 4);

        // Update all subscriptions for this student
        await updateAllStudentSubscriptions(studentId, newTotalSessions, newRemainingSessions, newPlanDurationMonths);

        // Create notification
        await supabase
          .from('student_notifications')
          .insert({
            student_id: studentId,
            title: `Sessions ${type === 'add' ? 'Added' : 'Removed'}`,
            message: `${adjustment} session${adjustment !== 1 ? 's' : ''} ${type === 'add' ? 'added to' : 'removed from'} your subscription. You now have ${newRemainingSessions} sessions remaining.`,
            notification_type: 'session_update',
          });
      }

      toast({
        title: "Success",
        description: `${adjustment} session${adjustment !== 1 ? 's' : ''} ${type === 'add' ? 'added to' : 'removed from'} ${selectedStudents.length} student${selectedStudents.length !== 1 ? 's' : ''}`,
      });

      setSelectedStudents([]);
      setSessionAdjustment("");
      onSubscriptionUpdated();
    } catch (error) {
      console.error('Error adjusting sessions:', error);
      toast({
        title: "Error",
        description: "Failed to adjust sessions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchStudents();
      // Reset state when dialog opens
      setSelectedStudents([]);
      setSearchTerm("");
      setPlanDurationMonths("");
      setSessionAdjustment("");
    }
  }, [open]);

  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.unique_id && student.unique_id.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Manage Global Subscriptions
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Student Search */}
          <div className="space-y-2">
            <Label>Search Students</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Student Selection List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Select Students ({selectedStudents.length} selected)</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
              >
                {selectedStudents.length === filteredStudents.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>
            
            <div className="max-h-60 overflow-y-auto border rounded-md">
              {filteredStudents.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center space-x-3 p-3 hover:bg-gray-50 border-b last:border-b-0"
                >
                  <Checkbox
                    checked={selectedStudents.includes(student.id)}
                    onCheckedChange={(checked) => handleStudentToggle(student.id, !!checked)}
                  />
                  <div className="flex-1">
                    <div className="font-medium">{student.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {student.email} {student.unique_id && `• ID: ${student.unique_id}`}
                    </div>
                  </div>
                </div>
              ))}
              {filteredStudents.length === 0 && (
                <div className="p-4 text-center text-muted-foreground">
                  No students found
                </div>
              )}
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedStudents.length > 0 && (
            <div className="space-y-4 border-t pt-4">
              <div className="font-medium">
                Bulk Actions for {selectedStudents.length} student{selectedStudents.length !== 1 ? 's' : ''}
              </div>

              {/* Create New Subscription */}
              <div className="space-y-3">
                <Label>Create New Subscription (Months)</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Enter number of months (e.g., 1, 3, 6, 12)"
                    value={planDurationMonths}
                    onChange={(e) => setPlanDurationMonths(e.target.value)}
                    min="1"
                  />
                  <Button
                    onClick={handleBulkCreateSubscription}
                    disabled={loading || !planDurationMonths}
                    className="whitespace-nowrap"
                  >
                    {loading ? "Creating..." : "Create Subscriptions"}
                  </Button>
                </div>
                {planDurationMonths && !isNaN(parseInt(planDurationMonths)) && parseInt(planDurationMonths) > 0 && (
                  <p className="text-sm text-muted-foreground">
                    This will create {parseInt(planDurationMonths) * 4} sessions for each selected student
                  </p>
                )}
              </div>

              {/* Adjust Existing Sessions */}
              <div className="space-y-3">
                <Label>Adjust Existing Sessions</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Number of sessions"
                    value={sessionAdjustment}
                    onChange={(e) => setSessionAdjustment(e.target.value)}
                    min="1"
                  />
                  <Button
                    onClick={() => handleBulkSessionAdjustment('add')}
                    disabled={loading || !sessionAdjustment}
                    className="flex items-center gap-1 whitespace-nowrap"
                  >
                    <Plus className="h-4 w-4" />
                    Add Sessions
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleBulkSessionAdjustment('remove')}
                    disabled={loading || !sessionAdjustment}
                    className="flex items-center gap-1 whitespace-nowrap"
                  >
                    <Minus className="h-4 w-4" />
                    Remove Sessions
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
