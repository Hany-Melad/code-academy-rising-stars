import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AddStudentToGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  courseId: string;
  onStudentAdded: () => void;
}

const formSchema = z.object({
  student_id: z.string().min(1, {
    message: "Student ID is required.",
  }),
});

type FormData = z.infer<typeof formSchema>;

export function AddStudentToGroupDialog({ 
  open, 
  onOpenChange, 
  groupId, 
  courseId, 
  onStudentAdded 
}: AddStudentToGroupDialogProps) {
  const { toast } = useToast();
  const { profile } = useAuth();
  const [students, setStudents] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      student_id: "",
    },
  });

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, name')
          .eq('role', 'student');

        if (error) {
          console.error("Error fetching students:", error);
          toast({
            title: "Error",
            description: "Failed to load students",
            variant: "destructive",
          });
        } else {
          setStudents(data || []);
        }
      } catch (error) {
        console.error("Error fetching students:", error);
        toast({
          title: "Error",
          description: "Failed to load students",
          variant: "destructive",
        });
      }
    };

    fetchStudents();
  }, []);

  const onSubmit = async (values: FormData) => {
    try {
      setLoading(true);

      // Get group details for notification
      const { data: groupData } = await supabase
        .from('course_groups')
        .select('title')
        .eq('id', groupId)
        .single();

      // Validate if the student is already enrolled in the course
      const { data: existingCourse, error: existingCourseError } = await supabase
        .from('student_courses')
        .select('*')
        .eq('student_id', values.student_id)
        .eq('course_id', courseId);

      if (existingCourseError) throw existingCourseError;

      let studentCourseId;

      if (existingCourse && existingCourse.length > 0) {
        // Student is already enrolled, use existing student_course_id
        studentCourseId = existingCourse[0].id;
      } else {
        // Student is not enrolled, create a new student_course entry
        const { data: newStudentCourse, error: newStudentCourseError } = await supabase
          .from('student_courses')
          .insert({
            student_id: values.student_id,
            course_id: courseId,
            progress: 0,
          })
          .select('id')
          .single();

        if (newStudentCourseError) throw newStudentCourseError;
        studentCourseId = newStudentCourse.id;
      }

      // Add student to group
      const { error: groupError } = await supabase
        .from('course_group_students')
        .insert({
          group_id: groupId,
          student_id: values.student_id,
          student_course_id: studentCourseId,
        });

      if (groupError) throw groupError;

      // Create notification with group name
      await supabase
        .from('student_notifications')
        .insert({
          student_id: values.student_id,
          title: 'Added to New Group',
          message: `You have been added to the course group "${groupData?.title || 'Unknown Group'}". Check your dashboard for details.`,
          notification_type: 'group_added',
        });

      toast({
        title: "Success",
        description: "Student added to group successfully",
      });
      form.reset();
      onStudentAdded();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error adding student to group:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add student to group",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Student to Group</DialogTitle>
          <DialogDescription>
            Select a student to add to the group.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="student_id">Student</Label>
            <Select onValueChange={form.setValue} defaultValue={form.getValues("student_id")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a student" />
              </SelectTrigger>
              <SelectContent>
                {students.map((student) => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? "Adding..." : "Add Student"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
