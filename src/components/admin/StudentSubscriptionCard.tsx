
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Plus, Minus, Clock, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { RefillSessionsDialog } from "./RefillSessionsDialog";

interface SubscriptionData {
  id: string;
  remaining_sessions: number;
  total_sessions: number;
  plan_duration_months: number;
  warning: boolean;
  student_course_id: string;
  created_at: string;
}

interface StudentSubscriptionCardProps {
  studentId: string;
  studentName: string;
  courseId: string;
}

export function StudentSubscriptionCard({ studentId, studentName, courseId }: StudentSubscriptionCardProps) {
  const { toast } = useToast();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refillDialogOpen, setRefillDialogOpen] = useState(false);

  useEffect(() => {
    fetchSubscription();
  }, [studentId, courseId]);

  const fetchSubscription = async () => {
    try {
      const { data: studentCourse } = await supabase
        .from('student_courses')
        .select('id')
        .eq('student_id', studentId)
        .eq('course_id', courseId)
        .single();

      if (!studentCourse) return;

      const { data, error } = await supabase
        .from('student_course_subscription')
        .select('*')
        .eq('student_course_id', studentCourse.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setSubscription(data);
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeSession = async () => {
    if (!subscription || subscription.remaining_sessions <= 0) return;

    try {
      const newRemainingSessions = subscription.remaining_sessions - 1;
      
      const { error } = await supabase
        .from('student_course_subscription')
        .update({
          remaining_sessions: newRemainingSessions,
          warning: newRemainingSessions <= 2,
          updated_at: new Date().toISOString(),
        })
        .eq('id', subscription.id);

      if (error) throw error;

      // Create notification for the student
      await supabase
        .from('student_notifications')
        .insert({
          student_id: studentId,
          title: 'Session Removed from Your Subscription',
          message: `Admin removed one session from your subscription on ${new Date().toLocaleDateString()}. You now have ${newRemainingSessions} sessions remaining.`,
          notification_type: 'session_removal',
        });

      setSubscription(prev => prev ? {
        ...prev,
        remaining_sessions: newRemainingSessions,
        warning: newRemainingSessions <= 2
      } : null);

      toast({
        title: "Session removed",
        description: `Removed one session from ${studentName}'s subscription`,
      });
    } catch (error) {
      console.error('Error removing session:', error);
      toast({
        title: "Error",
        description: "Failed to remove session",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">Loading subscription...</p>
        </CardContent>
      </Card>
    );
  }

  if (!subscription) {
    return (
      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">No subscription found</p>
        </CardContent>
      </Card>
    );
  }

  const correctTotalSessions = subscription.plan_duration_months * 4;
  const usedSessions = correctTotalSessions - subscription.remaining_sessions;
  const progressPercentage = correctTotalSessions > 0 
    ? (usedSessions / correctTotalSessions) * 100 
    : 0;

  const isLowSessions = subscription.remaining_sessions <= 2 && subscription.remaining_sessions > 0;
  const isExpired = subscription.remaining_sessions === 0;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Subscription Management
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setRefillDialogOpen(true)}
                className="flex items-center gap-1"
              >
                <Plus className="h-3 w-3" />
                Refill
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={removeSession}
                disabled={subscription.remaining_sessions <= 0}
                className="flex items-center gap-1"
              >
                <Minus className="h-3 w-3" />
                Remove
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Status:</span>
            {subscription.warning && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Warning
              </Badge>
            )}
            {isExpired && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Expired
              </Badge>
            )}
            {isLowSessions && !isExpired && (
              <Badge variant="outline" className="flex items-center gap-1 border-orange-200 text-orange-700">
                <AlertCircle className="h-3 w-3" />
                Low Sessions
              </Badge>
            )}
            {!isExpired && !isLowSessions && !subscription.warning && (
              <Badge variant="outline" className="flex items-center gap-1 border-green-200 text-green-700">
                Active
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Remaining Sessions:</span>
              <p className={`font-semibold ${isExpired ? 'text-red-600' : isLowSessions ? 'text-orange-600' : 'text-green-600'}`}>
                {subscription.remaining_sessions}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Total Sessions:</span>
              <p className="font-semibold">{correctTotalSessions}</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{usedSessions} / {correctTotalSessions} used</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>

          <div className="text-xs text-muted-foreground">
            Plan Duration: {subscription.plan_duration_months} month{subscription.plan_duration_months !== 1 ? 's' : ''} • 
            Started: {new Date(subscription.created_at).toLocaleDateString()}
          </div>
        </CardContent>
      </Card>

      <RefillSessionsDialog
        open={refillDialogOpen}
        onOpenChange={setRefillDialogOpen}
        studentId={studentId}
        studentName={studentName}
        subscriptionId={subscription.id}
        onRefillComplete={fetchSubscription}
      />
    </>
  );
}
