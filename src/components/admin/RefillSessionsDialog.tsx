
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";

const refillFormSchema = z.object({
  additionalSessions: z.number().min(1, "Must add at least 1 session"),
});

type RefillFormValues = z.infer<typeof refillFormSchema>;

interface RefillSessionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
  studentName: string;
  subscriptionId: string;
  onRefillComplete: () => void;
}

export const RefillSessionsDialog = ({
  open,
  onOpenChange,
  studentId,
  studentName,
  subscriptionId,
  onRefillComplete
}: RefillSessionsDialogProps) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm<RefillFormValues>({
    resolver: zodResolver(refillFormSchema),
    defaultValues: {
      additionalSessions: 1,
    },
  });

  const updateAllStudentSubscriptions = async (studentId: string, additionalSessions: number) => {
    console.log('Updating all subscriptions for student:', studentId);
    
    // Get all student courses for this student
    const { data: studentCourses } = await supabase
      .from('student_courses')
      .select('id')
      .eq('student_id', studentId);

    if (!studentCourses || studentCourses.length === 0) {
      throw new Error('No student courses found');
    }

    // Get current subscription data from the first student course
    const { data: currentSubscription } = await supabase
      .from('student_course_subscription')
      .select('*')
      .eq('student_course_id', studentCourses[0].id)
      .single();

    if (!currentSubscription) {
      throw new Error('No subscription found');
    }

    const newRemainingSessions = currentSubscription.remaining_sessions + additionalSessions;
    const newTotalSessions = currentSubscription.total_sessions + additionalSessions;
    const newPlanDurationMonths = Math.ceil(newTotalSessions / 4);

    // Update all subscriptions for this student across all courses
    for (const studentCourse of studentCourses) {
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

    return { newRemainingSessions, newTotalSessions };
  };

  const handleRefill = async (data: RefillFormValues) => {
    if (!profile) return;

    try {
      setLoading(true);

      // Update all subscriptions for this student
      const { newRemainingSessions } = await updateAllStudentSubscriptions(studentId, data.additionalSessions);

      // Create notification for the student
      const { error: notificationError } = await supabase
        .from('student_notifications')
        .insert({
          student_id: studentId,
          title: 'Sessions Added to Your Subscription',
          message: `Admin refilled your global subscription with ${data.additionalSessions} session${data.additionalSessions > 1 ? 's' : ''} on ${new Date().toLocaleDateString()}. You now have ${newRemainingSessions} sessions remaining across all your groups.`,
          notification_type: 'session_refill',
        });

      if (notificationError) throw notificationError;

      toast({
        title: "Sessions refilled",
        description: `Added ${data.additionalSessions} session${data.additionalSessions > 1 ? 's' : ''} to ${studentName}'s global subscription`,
      });

      form.reset();
      onRefillComplete();
      onOpenChange(false);
    } catch (error) {
      console.error('Error refilling sessions:', error);
      toast({
        title: "Error",
        description: "Failed to refill sessions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Refill Global Sessions for {studentName}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleRefill)} className="space-y-4">
            <FormField
              control={form.control}
              name="additionalSessions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Sessions</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-sm text-muted-foreground">
                    Sessions will be added to the student's global subscription and apply to all groups they're enrolled in.
                  </p>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Adding..." : "Add Sessions"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
