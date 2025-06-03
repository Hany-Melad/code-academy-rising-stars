
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Eye, EyeOff } from "lucide-react";
import { AddStudentsDialog } from "./AddStudentsDialog";
import { supabase } from "@/lib/supabase";
import { Profile } from "@/types/supabase";

interface StudentsTabProps {
  courseId: string;
  enrolledStudents: Profile[];
  onStudentEnrolled: (student: Profile) => void;
  onStudentRemoved: (studentId: string) => void;
}

export const StudentsTab = ({ 
  courseId, 
  enrolledStudents, 
  onStudentEnrolled, 
  onStudentRemoved 
}: StudentsTabProps) => {
  const { toast } = useToast();
  const [showStudentDialog, setShowStudentDialog] = useState(false);
  const [updatingStudentId, setUpdatingStudentId] = useState<string | null>(null);
  const [studentRestrictions, setStudentRestrictions] = useState<Record<string, boolean>>({});
  const [studentSubscriptions, setStudentSubscriptions] = useState<Record<string, number>>({});

  // Load student restrictions and subscription data
  useEffect(() => {
    const loadStudentData = async () => {
      try {
        // Load restrictions
        const { data: restrictionData, error: restrictionError } = await supabase
          .from('student_courses')
          .select('student_id, hide_new_sessions')
          .eq('course_id', courseId);

        if (restrictionError) throw restrictionError;

        const restrictions: Record<string, boolean> = {};
        restrictionData?.forEach(item => {
          restrictions[item.student_id] = item.hide_new_sessions || false;
        });
        setStudentRestrictions(restrictions);

        // Load subscription data to check remaining sessions
        const { data: subscriptionData, error: subscriptionError } = await supabase
          .from('student_courses')
          .select(`
            student_id,
            student_course_subscription!inner(remaining_sessions)
          `)
          .eq('course_id', courseId);

        if (subscriptionError) throw subscriptionError;

        const subscriptions: Record<string, number> = {};
        subscriptionData?.forEach(item => {
          if (item.student_course_subscription && item.student_course_subscription.length > 0) {
            subscriptions[item.student_id] = item.student_course_subscription[0].remaining_sessions;
          }
        });
        setStudentSubscriptions(subscriptions);

        // Auto-hide sessions for students with 0 remaining sessions
        for (const [studentId, remainingSessions] of Object.entries(subscriptions)) {
          if (remainingSessions === 0 && !restrictions[studentId]) {
            console.log(`Auto-hiding sessions for student ${studentId} with 0 remaining sessions`);
            await toggleStudentSessionVisibility(studentId, true, false);
          }
        }

      } catch (error) {
        console.error('Error loading student data:', error);
      }
    };

    loadStudentData();
  }, [courseId, enrolledStudents]);

  const toggleStudentSessionVisibility = async (studentId: string, forceValue?: boolean, showToast = true) => {
    try {
      setUpdatingStudentId(studentId);
      const currentlyHidden = studentRestrictions[studentId] || false;
      const newValue = forceValue !== undefined ? forceValue : !currentlyHidden;
      
      console.log('Toggling session visibility for student:', { studentId, courseId, newValue });
      
      // Update the student_courses table to hide/show new sessions
      const { error } = await supabase
        .from('student_courses')
        .update({ hide_new_sessions: newValue })
        .eq('course_id', courseId)
        .eq('student_id', studentId);
      
      if (error) {
        console.error('Error updating student session visibility:', error);
        throw error;
      }
      
      console.log('Student session visibility updated successfully');
      
      // Update local state
      setStudentRestrictions(prev => ({
        ...prev,
        [studentId]: newValue
      }));
      
      if (showToast) {
        toast({
          title: "Success",
          description: `Student ${newValue ? 'will not see' : 'can now see'} new sessions.`,
        });
      }
    } catch (error) {
      console.error('Error updating student session visibility:', error);
      if (showToast) {
        toast({
          title: "Error",
          description: "Failed to update student session visibility.",
          variant: "destructive",
        });
      }
    } finally {
      setUpdatingStudentId(null);
    }
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Enrolled Students</h2>
          <Button onClick={() => setShowStudentDialog(true)}>
            <Plus className="h-4 w-4 mr-2" /> Add Students
          </Button>
        </div>
        
        {enrolledStudents.length > 0 ? (
          <div className="border rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remaining Sessions</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">New Sessions Access</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {enrolledStudents.map((student) => {
                  const isHidden = studentRestrictions[student.id] || false;
                  const remainingSessions = studentSubscriptions[student.id] || 0;
                  const isZeroSessions = remainingSessions === 0;
                  
                  return (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{student.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{student.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{student.unique_id || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm ${isZeroSessions ? 'text-red-600 font-semibold' : 'text-gray-900'}`}>
                          {remainingSessions}
                          {isZeroSessions && (
                            <span className="ml-2 text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                              Auto-hidden
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm ${isHidden ? 'text-red-600' : 'text-green-600'}`}>
                          {isHidden ? 'Hidden' : 'Visible'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className={`${isHidden ? 'text-green-600 hover:text-green-900 hover:bg-green-50' : 'text-orange-600 hover:text-orange-900 hover:bg-orange-50'}`}
                          onClick={() => toggleStudentSessionVisibility(student.id)}
                          disabled={updatingStudentId === student.id || (isZeroSessions && !isHidden)}
                          title={isZeroSessions && !isHidden ? "Cannot show sessions - student has 0 remaining sessions" : ""}
                        >
                          {isHidden ? (
                            <>
                              <Eye className="h-4 w-4 mr-1" /> 
                              {updatingStudentId === student.id ? 'Showing...' : 'Show New Sessions'}
                            </>
                          ) : (
                            <>
                              <EyeOff className="h-4 w-4 mr-1" /> 
                              {updatingStudentId === student.id ? 'Hiding...' : 'Hide New Sessions'}
                            </>
                          )}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <Card className="bg-gray-50 border border-gray-200">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <h3 className="font-medium text-gray-900 mb-1">No students enrolled</h3>
              <p className="text-gray-600 mb-4">
                Add students to this course to get started
              </p>
              <Button onClick={() => setShowStudentDialog(true)}>
                <Plus className="h-4 w-4 mr-2" /> Add Students
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <AddStudentsDialog
        open={showStudentDialog}
        onOpenChange={setShowStudentDialog}
        courseId={courseId}
        enrolledStudents={enrolledStudents}
        onStudentEnrolled={onStudentEnrolled}
      />
    </>
  );
};
