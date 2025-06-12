
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { UserMinus, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Student {
  id: string;
  name: string;
  unique_id: string | null;
  total_points: number;
  remaining_sessions: number;
  total_sessions: number;
}

interface GroupStudentsTabProps {
  students: Student[];
  groupId: string;
  onStudentRemoved?: () => void;
  onManageSubscriptions?: () => void;
}

export const GroupStudentsTab = ({ 
  students, 
  groupId,
  onStudentRemoved,
  onManageSubscriptions 
}: GroupStudentsTabProps) => {
  const { toast } = useToast();
  const [updatingStudentId, setUpdatingStudentId] = useState<string | null>(null);

  const handleRemoveFromGroup = async (studentId: string) => {
    try {
      setUpdatingStudentId(studentId);
      
      const { error } = await supabase
        .from('course_group_students')
        .delete()
        .eq('group_id', groupId)
        .eq('student_id', studentId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Student removed from group successfully",
      });

      onStudentRemoved?.();
    } catch (error) {
      console.error('Error removing student from group:', error);
      toast({
        title: "Error",
        description: "Failed to remove student from group",
        variant: "destructive",
      });
    } finally {
      setUpdatingStudentId(null);
    }
  };

  if (students.length === 0) {
    return (
      <Card className="bg-gray-50 border border-gray-200">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <h3 className="font-medium text-gray-900 mb-1">No students in this group</h3>
          <p className="text-gray-600 mb-4">
            Add students to this group to get started
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Students ({students.length})</h2>
        <Button 
          onClick={onManageSubscriptions}
          className="flex items-center gap-2"
        >
          <Settings className="h-4 w-4" />
          Manage Subscriptions
        </Button>
      </div>
      
      <div className="border rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Points</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sessions</th>
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {students.map((student) => (
            <tr key={student.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="font-medium text-gray-900">{student.name}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-500">{student.unique_id || '-'}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{student.total_points}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  {student.remaining_sessions} / {student.total_sessions}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-red-600 hover:text-red-900 hover:bg-red-50"
                  onClick={() => handleRemoveFromGroup(student.id)}
                  disabled={updatingStudentId === student.id}
                >
                  <UserMinus className="h-4 w-4" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
};
