
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Plus, XCircle } from "lucide-react";
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

  const removeStudent = async (studentId: string) => {
    try {
      console.log('Removing student from course:', { studentId, courseId });
      
      // First, get all sessions for this course
      const { data: courseSessions, error: sessionsError } = await supabase
        .from('sessions')
        .select('id')
        .eq('course_id', courseId);
      
      if (sessionsError) {
        console.error('Error fetching course sessions:', sessionsError);
        throw sessionsError;
      }
      
      console.log('Course sessions found:', courseSessions);
      
      // Delete student's progress for all sessions in this course
      if (courseSessions && courseSessions.length > 0) {
        const sessionIds = courseSessions.map(session => session.id);
        
        const { error: sessionProgressError } = await supabase
          .from('student_sessions')
          .delete()
          .eq('student_id', studentId)
          .in('session_id', sessionIds);
        
        if (sessionProgressError) {
          console.error('Error removing student session progress:', sessionProgressError);
          throw sessionProgressError;
        }
        
        console.log('Student session progress removed for sessions:', sessionIds);
      }
      
      // Then remove the enrollment record
      const { error: enrollmentError } = await supabase
        .from('student_courses')
        .delete()
        .eq('course_id', courseId)
        .eq('student_id', studentId);
      
      if (enrollmentError) {
        console.error('Error removing student enrollment:', enrollmentError);
        throw enrollmentError;
      }
      
      console.log('Student enrollment removed successfully');
      
      onStudentRemoved(studentId);
      
      toast({
        title: "Success",
        description: "Student removed from course and their progress has been reset.",
      });
    } catch (error) {
      console.error('Error removing student:', error);
      toast({
        title: "Error",
        description: "Failed to remove student from course.",
        variant: "destructive",
      });
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
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {enrolledStudents.map((student) => (
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
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-600 hover:text-red-900 hover:bg-red-50"
                        onClick={() => removeStudent(student.id)}
                      >
                        <XCircle className="h-4 w-4 mr-1" /> Remove
                      </Button>
                    </td>
                  </tr>
                ))}
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
