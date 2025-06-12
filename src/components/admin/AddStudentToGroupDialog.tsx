
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { Profile } from "@/types/supabase";
import { Search, User, Mail, Phone } from "lucide-react";

interface AddStudentToGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  onStudentAdded: () => void;
  enrolledStudentIds: string[];
}

export const AddStudentToGroupDialog = ({
  open,
  onOpenChange,
  groupId,
  onStudentAdded,
  enrolledStudentIds,
}: AddStudentToGroupDialogProps) => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  const searchStudents = async (term: string) => {
    if (!term.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'student')
        .or(`unique_id.ilike.%${term}%,name.ilike.%${term}%,email.ilike.%${term}%`)
        .not('id', 'in', `(${enrolledStudentIds.join(',')})`)
        .limit(10);

      if (error) throw error;

      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching students:', error);
      toast({
        title: "Error",
        description: "Failed to search students",
        variant: "destructive",
      });
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      searchStudents(searchTerm);
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [searchTerm]);

  const handleAddStudent = async () => {
    if (!selectedStudent) return;

    try {
      setLoading(true);

      // First, create or get the student_course record for this group's course
      const { data: groupData, error: groupError } = await supabase
        .from('course_groups')
        .select('course_id')
        .eq('id', groupId)
        .single();

      if (groupError) throw groupError;

      // Check if student is already enrolled in this course
      let { data: studentCourse, error: studentCourseError } = await supabase
        .from('student_courses')
        .select('id')
        .eq('student_id', selectedStudent.id)
        .eq('course_id', groupData.course_id)
        .maybeSingle();

      if (studentCourseError) throw studentCourseError;

      // If not enrolled, create student_course record
      if (!studentCourse) {
        const { data: newStudentCourse, error: createError } = await supabase
          .from('student_courses')
          .insert({
            student_id: selectedStudent.id,
            course_id: groupData.course_id,
            progress: 0,
          })
          .select('id')
          .single();

        if (createError) throw createError;
        studentCourse = newStudentCourse;

        // Create default subscription for the new student_course
        const { error: subscriptionError } = await supabase
          .from('student_course_subscription')
          .insert({
            student_course_id: studentCourse.id,
            total_sessions: 0,
            remaining_sessions: 0,
            plan_duration_months: 1,
          });

        if (subscriptionError) throw subscriptionError;
      }

      // Add student to the group
      const { error: groupStudentError } = await supabase
        .from('course_group_students')
        .insert({
          group_id: groupId,
          student_id: selectedStudent.id,
          student_course_id: studentCourse.id,
        });

      if (groupStudentError) throw groupStudentError;

      toast({
        title: "Success",
        description: `${selectedStudent.name} has been added to the group`,
      });

      onStudentAdded();
      onOpenChange(false);
      setSelectedStudent(null);
      setSearchTerm("");
      setSearchResults([]);
    } catch (error) {
      console.error('Error adding student to group:', error);
      toast({
        title: "Error",
        description: "Failed to add student to group",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setSelectedStudent(null);
    setSearchTerm("");
    setSearchResults([]);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Student to Group</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="search">Search Student</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="search"
                placeholder="Search by Student ID, name, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
              {searching && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                </div>
              )}
            </div>
          </div>

          {searchResults.length > 0 && (
            <div className="max-h-60 overflow-y-auto border rounded-lg">
              {searchResults.map((student) => (
                <div
                  key={student.id}
                  className={`p-3 border-b last:border-b-0 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedStudent?.id === student.id ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                  onClick={() => setSelectedStudent(student)}
                >
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-gray-400" />
                    <div className="flex-1">
                      <p className="font-medium">{student.name}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>ID: {student.unique_id || 'Not assigned'}</span>
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {student.email}
                        </span>
                        {student.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {student.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {selectedStudent && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Selected Student:</h4>
              <div className="space-y-1 text-sm">
                <p><strong>Name:</strong> {selectedStudent.name}</p>
                <p><strong>ID:</strong> {selectedStudent.unique_id || 'Not assigned'}</p>
                <p><strong>Email:</strong> {selectedStudent.email}</p>
                {selectedStudent.phone && (
                  <p><strong>Phone:</strong> {selectedStudent.phone}</p>
                )}
              </div>
            </div>
          )}

          {searchTerm && searchResults.length === 0 && !searching && (
            <div className="text-center py-4 text-gray-500">
              No students found matching your search.
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleAddStudent}
            disabled={!selectedStudent || loading}
            className="bg-academy-blue hover:bg-blue-600"
          >
            {loading ? "Adding..." : "Add Student"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
