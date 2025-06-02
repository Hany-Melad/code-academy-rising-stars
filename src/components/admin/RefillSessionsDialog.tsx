
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

  const handleRefill = async (data: RefillFormValues) => {
    if (!profile) return;

    try {
      setLoading(true);

      // Get current subscription data
      const { data: subscription, error: fetchError } = await supabase
        .from('student_course_subscription')
        .select('remaining_sessions, total_sessions')
        .eq('id', subscriptionId)
        .single();

      if (fetchError) throw fetchError;

      // Update subscription with additional sessions
      const newRemainingSessions = subscription.remaining_sessions + data.additionalSessions;
      const newTotalSessions = subscription.total_sessions + data.additionalSessions;

      const { error: updateError } = await supabase
        .from('student_course_subscription')
        .update({
          remaining_sessions: newRemainingSessions,
          total_sessions: newTotalSessions,
          warning: newRemainingSessions <= 2,
          updated_at: new Date().toISOString(),
        })
        .eq('id', subscriptionId);

      if (updateError) throw updateError;

      // Create notification for the student
      const { error: notificationError } = await supabase
        .from('student_notifications')
        .insert({
          student_id: studentId,
          title: 'Sessions Added to Your Subscription',
          message: `Admin refilled your subscription with ${data.additionalSessions} session${data.additionalSessions > 1 ? 's' : ''} on ${new Date().toLocaleDateString()}. You now have ${newRemainingSessions} sessions remaining.`,
          notification_type: 'session_refill',
        });

      if (notificationError) throw notificationError;

      toast({
        title: "Sessions refilled",
        description: `Added ${data.additionalSessions} session${data.additionalSessions > 1 ? 's' : ''} to ${studentName}'s subscription`,
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
          <DialogTitle>Refill Sessions for {studentName}</DialogTitle>
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
                    Number of sessions to add to the student's subscription
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
