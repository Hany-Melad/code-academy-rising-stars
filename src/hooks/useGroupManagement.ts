
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Student {
  id: string;
  name: string;
  unique_id: string | null;
  total_points: number;
  remaining_sessions: number;
  total_sessions: number;
}

export const useGroupManagement = () => {
  const { toast } = useToast();

  const getStudentGlobalSubscription = async (studentId: string) => {
    console.log('Getting global subscription for student:', studentId);
    
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
    
    const { data: studentCourses } = await supabase
      .from('student_courses')
      .select('id')
      .eq('student_id', studentId);

    if (!studentCourses || studentCourses.length === 0) {
      throw new Error('Student course not found');
    }

    const newPlanDurationMonths = Math.ceil(newTotalSessions / 4);

    for (const studentCourse of studentCourses) {
      const { data: existingSubscriptions } = await supabase
        .from('student_course_subscription')
        .select('id')
        .eq('student_course_id', studentCourse.id)
        .order('updated_at', { ascending: false });

      if (existingSubscriptions && existingSubscriptions.length > 1) {
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

  const handleAddSessions = async (studentId: string, sessions: number, groupTitle?: string) => {
    try {
      console.log('Adding sessions to student:', studentId, sessions);
      const currentSubscription = await getStudentGlobalSubscription(studentId);
      
      const newTotalSessions = currentSubscription.total_sessions + sessions;
      const newRemainingSessions = currentSubscription.remaining_sessions + sessions;

      await updateStudentGlobalSubscription(studentId, newRemainingSessions, newTotalSessions);

      await supabase
        .from('student_notifications')
        .insert({
          student_id: studentId,
          title: 'Sessions Added',
          message: `${sessions} session${sessions !== 1 ? 's' : ''} added to your global subscription${groupTitle ? ` from group "${groupTitle}"` : ''}. You now have ${newRemainingSessions} sessions remaining.`,
          notification_type: 'session_update',
        });

      toast({
        title: "Sessions added",
        description: `${sessions} session${sessions !== 1 ? 's' : ''} added successfully`,
      });

      return true;
    } catch (error) {
      console.error('Error adding sessions:', error);
      toast({
        title: "Error",
        description: "Failed to add sessions",
        variant: "destructive",
      });
      return false;
    }
  };

  const handleRemoveSessions = async (studentId: string, sessions: number, groupTitle?: string) => {
    try {
      console.log('Removing sessions from student:', studentId, sessions);
      const currentSubscription = await getStudentGlobalSubscription(studentId);
      
      const newTotalSessions = Math.max(0, currentSubscription.total_sessions - sessions);
      const newRemainingSessions = Math.max(0, currentSubscription.remaining_sessions - sessions);

      await updateStudentGlobalSubscription(studentId, newRemainingSessions, newTotalSessions);

      await supabase
        .from('student_notifications')
        .insert({
          student_id: studentId,
          title: 'Sessions Removed',
          message: `${sessions} session${sessions !== 1 ? 's' : ''} removed from your global subscription${groupTitle ? ` in group "${groupTitle}"` : ''}. You now have ${newRemainingSessions} sessions remaining.`,
          notification_type: 'session_update',
        });

      toast({
        title: "Sessions removed",
        description: `${sessions} session${sessions !== 1 ? 's' : ''} removed successfully`,
      });

      return true;
    } catch (error) {
      console.error('Error removing sessions:', error);
      toast({
        title: "Error",
        description: "Failed to remove sessions",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    getStudentGlobalSubscription,
    updateStudentGlobalSubscription,
    handleAddSessions,
    handleRemoveSessions,
  };
};
