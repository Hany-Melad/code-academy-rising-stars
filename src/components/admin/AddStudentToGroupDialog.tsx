
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";

const addStudentFormSchema = z.object({
  studentId: z.string().min(1, "Please select a student"),
});

type AddStudentFormValues = z.infer<typeof addStudentFormSchema>;

interface AddStudentToGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  courseId: string;
  onStudentAdded: () => void;
}

export const AddStudentToGroupDialog = ({ 
  open, 
  onOpenChange, 
  groupId, 
  courseId, 
  onStudentAdded 
}: AddStudentToGroupDialogProps) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [students, setStudents] = useState<Array<{id: string, name: string, unique_id: string | null}>>([]);
  const [loading, setLoading] = useState(false);

  const form = useForm<AddStudentFormValues>({
    resolver: zodResolver(addStudentFormSchema),
    defaultValues: {
      studentId: "",
    },
  });

  useEffect(() => {
    if (open) {
      fetchAvailableStudents();
    }
  }, [open, groupId, courseId]);

  const fetchAvailableStudents = async () => {
    try {
      // Get all students
      const { data: allStudents, error: studentsError } = await supabase
        .from('profiles')
        .select('id, name, unique_id')
        .eq('role', 'student');

      if (studentsError) throw studentsError;

      // Get students already in this group
      const { data: groupStudents, error: groupError } = await supabase
        .from('course_group_students')
        .select('student_id')
        .eq('group_id', groupId);

      if (groupError) throw groupError;

      const enrolledStudentIds = new Set(groupStudents?.map(gs => gs.student_id) || []);
      
      // Filter out students already in the group
      const availableStudents = (allStudents || []).filter(
        student => !enrolledStudentIds.has(student.id)
      );

      setStudents(availableStudents);
    } catch (error) {
      console.error('Error fetching available students:', error);
      toast({
        title: "Error",
        description: "Failed to load available students",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (data: AddStudentFormValues) => {
    if (!profile) return;

    try {
      setLoading(true);

      // First, create or get the student_course record
      let studentCourseId: string;
      
      const { data: existingEnrollment } = await supabase
        .from('student_courses')
        .select('id')
        .eq('student_id', data.studentId)
        .eq('course_id', courseId)
        .maybeSingle();

      if (existingEnrollment) {
        studentCourseId = existingEnrollment.id;
      } else {
        const { data: newEnrollment, error: enrollError } = await supabase
          .from('student_courses')
          .insert({
            student_id: data.studentId,
            course_id: courseId,
            assigned_by: profile.id,
            progress: 0,
          })
          .select('id')
          .single();

        if (enrollError) throw enrollError;
        studentCourseId = newEnrollment.id;
      }

      // Add student to group (no subscription creation here)
      const { error: groupError } = await supabase
        .from('course_group_students')
        .insert({
          group_id: groupId,
          student_id: data.studentId,
          student_course_id: studentCourseId,
        });

      if (groupError) throw groupError;

      // Create notification for the student
      const { error: notificationError } = await supabase
        .from('student_notifications')
        .insert({
          student_id: data.studentId,
          title: 'Added to New Group',
          message: `You have been added to a new course group. Check your dashboard for details.`,
          notification_type: 'group_added',
        });

      if (notificationError) {
        console.error('Error creating notification:', notificationError);
      }

      toast({
        title: "Student added",
        description: "Student has been added to the group successfully",
      });

      form.reset();
      onStudentAdded();
      onOpenChange(false);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Add Student to Group</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="studentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Student</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a student" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {students.map((student) => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.name} {student.unique_id && `(${student.unique_id})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                  <p className="text-sm text-muted-foreground">
                    Note: Student will be added without a subscription. Use "Add Subscription Plan" to create their subscription.
                  </p>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Adding..." : "Add Student"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
