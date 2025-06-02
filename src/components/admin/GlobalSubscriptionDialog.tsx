
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
import { supabase } from "@/lib/supabase";
import { Search, Plus, Minus } from "lucide-react";

interface Student {
  id: string;
  name: string;
  unique_id: string | null;
  email: string;
}

interface Subscription {
  id: string;
  remaining_sessions: number;
  total_sessions: number;
  plan_duration_months: number;
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
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);
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

  const fetchStudentSubscription = async (studentId: string) => {
    try {
      console.log('Fetching subscription for student:', studentId);
      
      // Get any student course for this student
      const { data: studentCourses } = await supabase
        .from('student_courses')
        .select('id')
        .eq('student_id', studentId)
        .limit(1);

      console.log('Student courses found:', studentCourses);

      if (!studentCourses || studentCourses.length === 0) {
        console.log('No student courses found');
        setCurrentSubscription(null);
        return;
      }

      const { data: subscription, error } = await supabase
        .from('student_course_subscription')
        .select('*')
        .eq('student_course_id', studentCourses[0].id)
        .single();

      console.log('Subscription query result:', { subscription, error });

      if (subscription) {
        setCurrentSubscription({
          id: subscription.id,
          remaining_sessions: subscription.remaining_sessions,
          total_sessions: subscription.total_sessions,
          plan_duration_months: subscription.plan_duration_months,
        });
        setPlanDurationMonths(subscription.plan_duration_months.toString());
      } else {
        console.log('No subscription found');
        setCurrentSubscription(null);
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
      setCurrentSubscription(null);
    }
  };

  const handleStudentSelect = async (student: Student) => {
    console.log('Selected student:', student);
    setSelectedStudent(student);
    await fetchStudentSubscription(student.id);
  };

  const handleCreateSubscription = async () => {
    if (!selectedStudent || !planDurationMonths) return;

    try {
      setLoading(true);
      console.log('Creating subscription for student:', selectedStudent.id);

      // Check if student already has a subscription
      if (currentSubscription) {
        toast({
          title: "Error",
          description: "Student already has a subscription. Use the session adjustment options instead.",
          variant: "destructive",
        });
        return;
      }

      const duration = parseInt(planDurationMonths);
      if (isNaN(duration) || duration <= 0) {
        toast({
          title: "Error",
          description: "Please enter a valid number of months",
          variant: "destructive",
        });
        return;
      }

      // Get or create student course for any course (we'll use the first available course)
      const { data: courses } = await supabase
        .from('courses')
        .select('id')
        .limit(1);

      if (!courses || courses.length === 0) {
        toast({
          title: "Error",
          description: "No courses available. Please create a course first.",
          variant: "destructive",
        });
        return;
      }

      const courseId = courses[0].id;
      console.log('Using course ID:', courseId);

      // Check if student course exists
      let { data: studentCourse } = await supabase
        .from('student_courses')
        .select('id')
        .eq('student_id', selectedStudent.id)
        .eq('course_id', courseId)
        .single();

      console.log('Existing student course:', studentCourse);

      // Create student course if it doesn't exist
      if (!studentCourse) {
        console.log('Creating new student course');
        const { data: newStudentCourse, error: courseError } = await supabase
          .from('student_courses')
          .insert({
            student_id: selectedStudent.id,
            course_id: courseId,
            progress: 0,
          })
          .select('id')
          .single();

        if (courseError) {
          console.error('Error creating student course:', courseError);
          throw courseError;
        }
        studentCourse = newStudentCourse;
        console.log('Created student course:', studentCourse);
      }

      const totalSessions = duration * 4;
      console.log('Creating subscription with:', { duration, totalSessions });

      // Create subscription
      const { data: newSubscription, error: subscriptionError } = await supabase
        .from('student_course_subscription')
        .insert({
          student_course_id: studentCourse.id,
          plan_duration_months: duration,
          total_sessions: totalSessions,
          remaining_sessions: totalSessions,
          warning: false,
        })
        .select('*')
        .single();

      if (subscriptionError) {
        console.error('Error creating subscription:', subscriptionError);
        throw subscriptionError;
      }

      console.log('Created subscription:', newSubscription);

      // Create notification
      await supabase
        .from('student_notifications')
        .insert({
          student_id: selectedStudent.id,
          title: 'Subscription Created',
          message: `A new ${duration}-month subscription with ${totalSessions} sessions has been created for you.`,
          notification_type: 'subscription_change',
        });

      toast({
        title: "Success",
        description: `Subscription created for ${selectedStudent.name} with ${totalSessions} sessions`,
      });

      // Refresh subscription data
      await fetchStudentSubscription(selectedStudent.id);
      onSubscriptionUpdated();
    } catch (error) {
      console.error('Error creating subscription:', error);
      toast({
        title: "Error",
        description: "Failed to create subscription",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSessionAdjustment = async (type: 'add' | 'remove') => {
    if (!selectedStudent || !currentSubscription || !sessionAdjustment) return;

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

      let newRemainingSessions, newTotalSessions;
      
      if (type === 'add') {
        newTotalSessions = currentSubscription.total_sessions + adjustment;
        newRemainingSessions = currentSubscription.remaining_sessions + adjustment;
      } else {
        newTotalSessions = Math.max(0, currentSubscription.total_sessions - adjustment);
        newRemainingSessions = Math.max(0, currentSubscription.remaining_sessions - adjustment);
      }

      const newPlanDurationMonths = Math.ceil(newTotalSessions / 4);

      // Get student course
      const { data: studentCourses } = await supabase
        .from('student_courses')
        .select('id')
        .eq('student_id', selectedStudent.id)
        .limit(1);

      if (!studentCourses || studentCourses.length === 0) {
        throw new Error('Student course not found');
      }

      // Update subscription
      const { error } = await supabase
        .from('student_course_subscription')
        .update({
          total_sessions: newTotalSessions,
          remaining_sessions: newRemainingSessions,
          plan_duration_months: newPlanDurationMonths,
          warning: newRemainingSessions <= 2,
          updated_at: new Date().toISOString(),
        })
        .eq('student_course_id', studentCourses[0].id);

      if (error) throw error;

      // Create notification
      await supabase
        .from('student_notifications')
        .insert({
          student_id: selectedStudent.id,
          title: `Sessions ${type === 'add' ? 'Added' : 'Removed'}`,
          message: `${adjustment} session${adjustment !== 1 ? 's' : ''} ${type === 'add' ? 'added to' : 'removed from'} your subscription. You now have ${newRemainingSessions} sessions remaining.`,
          notification_type: 'session_update',
        });

      toast({
        title: "Success",
        description: `${adjustment} session${adjustment !== 1 ? 's' : ''} ${type === 'add' ? 'added' : 'removed'} successfully`,
      });

      // Refresh subscription data
      await fetchStudentSubscription(selectedStudent.id);
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
      setSelectedStudent(null);
      setCurrentSubscription(null);
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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage Global Subscription</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Student Search */}
          <div className="space-y-2">
            <Label>Search Student</Label>
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

          {/* Student Selection */}
          {searchTerm && (
            <div className="max-h-40 overflow-y-auto border rounded-md">
              {filteredStudents.map((student) => (
                <div
                  key={student.id}
                  className={`p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0 ${
                    selectedStudent?.id === student.id ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => handleStudentSelect(student)}
                >
                  <div className="font-medium">{student.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {student.email} {student.unique_id && `• ID: ${student.unique_id}`}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Selected Student Actions */}
          {selectedStudent && (
            <div className="space-y-4 border-t pt-4">
              <div className="font-medium">
                Managing subscription for: {selectedStudent.name}
              </div>

              {currentSubscription ? (
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Current Subscription</h4>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Plan Duration:</span>
                        <p className="font-semibold">{currentSubscription.plan_duration_months} month{currentSubscription.plan_duration_months !== 1 ? 's' : ''}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Total Sessions:</span>
                        <p className="font-semibold">{currentSubscription.total_sessions}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Remaining:</span>
                        <p className="font-semibold">{currentSubscription.remaining_sessions}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label>Adjust Sessions</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="Number of sessions"
                        value={sessionAdjustment}
                        onChange={(e) => setSessionAdjustment(e.target.value)}
                        min="1"
                      />
                      <Button
                        onClick={() => handleSessionAdjustment('add')}
                        disabled={loading || !sessionAdjustment}
                        className="flex items-center gap-1"
                      >
                        <Plus className="h-4 w-4" />
                        Add
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleSessionAdjustment('remove')}
                        disabled={loading || !sessionAdjustment}
                        className="flex items-center gap-1"
                      >
                        <Minus className="h-4 w-4" />
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <p className="text-sm text-orange-800">
                      No subscription found for this student. Create a new one below.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Label>Plan Duration (Months)</Label>
                    <Input
                      type="number"
                      placeholder="Enter number of months (e.g., 1, 3, 6, 12)"
                      value={planDurationMonths}
                      onChange={(e) => setPlanDurationMonths(e.target.value)}
                      min="1"
                    />
                    {planDurationMonths && !isNaN(parseInt(planDurationMonths)) && parseInt(planDurationMonths) > 0 && (
                      <p className="text-sm text-muted-foreground">
                        This will create {parseInt(planDurationMonths) * 4} sessions ({parseInt(planDurationMonths)} month{parseInt(planDurationMonths) !== 1 ? 's' : ''})
                      </p>
                    )}
                  </div>

                  <Button
                    onClick={handleCreateSubscription}
                    disabled={loading || !planDurationMonths}
                    className="w-full"
                  >
                    Create Subscription
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
