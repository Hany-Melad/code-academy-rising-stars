
import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Search, User } from "lucide-react";
import { supabase, ensureValidRole } from "@/lib/supabase";
import { Profile } from "@/types/supabase";

interface AddStudentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  enrolledStudents: Profile[];
  onStudentEnrolled: (student: Profile) => void;
}

export const AddStudentsDialog = ({ 
  open, 
  onOpenChange, 
  courseId, 
  enrolledStudents, 
  onStudentEnrolled 
}: AddStudentsDialogProps) => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Profile[]>([]);

  const searchStudents = async () => {
    try {
      if (!searchTerm.trim()) {
        setSearchResults([]);
        return;
      }
      
      console.log("Searching for students with term:", searchTerm);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'student')
        .or(`name.ilike.%${searchTerm}%,unique_id.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
      
      if (error) {
        console.error("Student search error:", error);
        throw error;
      }
      
      console.log("Search results:", data);
      
      const typedStudents = (data || []).map(student => ({
        ...student,
        role: ensureValidRole(student.role)
      }));
      
      const filteredResults = typedStudents.filter(
        student => !enrolledStudents.some(enrolled => enrolled.id === student.id)
      );
      
      setSearchResults(filteredResults);
      
      if (filteredResults.length === 0 && data && data.length > 0) {
        toast({
          title: "Info",
          description: "All matching students are already enrolled in this course.",
        });
      }
    } catch (error) {
      console.error('Error searching students:', error);
      toast({
        title: "Error",
        description: "Failed to search students.",
        variant: "destructive",
      });
    }
  };

  const enrollStudent = async (studentId: string) => {
    try {
      const { error } = await supabase
        .from('student_courses')
        .insert({
          student_id: studentId,
          course_id: courseId,
          progress: 0,
        });
      
      if (error) throw error;
      
      const studentToEnroll = searchResults.find(s => s.id === studentId);
      if (studentToEnroll) {
        onStudentEnrolled(studentToEnroll);
        setSearchResults(searchResults.filter(s => s.id !== studentId));
      }
      
      toast({
        title: "Success",
        description: "Student enrolled successfully!",
      });
    } catch (error) {
      console.error('Error enrolling student:', error);
      toast({
        title: "Error",
        description: "Failed to enroll student.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Students to Course</DialogTitle>
          <DialogDescription>
            Search for students by name, email, or ID to enroll them in this course.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Input
              placeholder="Search students by name, email, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  searchStudents();
                }
              }}
            />
            <Button type="button" onClick={searchStudents}>
              <Search className="h-4 w-4 mr-2" /> Search
            </Button>
          </div>
          
          <div className="max-h-60 overflow-y-auto border rounded-lg divide-y">
            {searchResults.length > 0 ? (
              searchResults.map((student) => (
                <div key={student.id} className="flex items-center justify-between p-3 hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="font-medium">{student.name}</p>
                      <p className="text-sm text-gray-500">{student.email}</p>
                      {student.unique_id && (
                        <p className="text-sm text-gray-500">ID: {student.unique_id}</p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm" 
                    onClick={() => enrollStudent(student.id)}
                  >
                    Enroll
                  </Button>
                </div>
              ))
            ) : searchTerm ? (
              <div className="p-4 text-center text-gray-500">No students found</div>
            ) : (
              <div className="p-4 text-center text-gray-500">Search for students to enroll</div>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button type="button" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
