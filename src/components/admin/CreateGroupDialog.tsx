
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { useGroupFormData } from "@/hooks/useGroupFormData";
import { GroupFormFields } from "./GroupFormFields";

const groupFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  courseId: z.string().min(1, "Please select a course"),
  branch: z.string().optional(),
  startDate: z.date({
    required_error: "Please select a start date",
  }),
  allowedAdminId: z.string().optional(),
});

type GroupFormValues = z.infer<typeof groupFormSchema>;

interface CreateGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGroupCreated: () => void;
}

export const CreateGroupDialog = ({ open, onOpenChange, onGroupCreated }: CreateGroupDialogProps) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const { courses, admins, coursesLoading } = useGroupFormData(open);

  const form = useForm<GroupFormValues>({
    resolver: zodResolver(groupFormSchema),
    defaultValues: {
      title: "",
      courseId: "",
      branch: "",
      startDate: new Date(),
      allowedAdminId: "",
    },
  });

  const handleSubmit = async (data: GroupFormValues) => {
    if (!profile) return;

    try {
      setLoading(true);

      const { error } = await supabase
        .from('course_groups')
        .insert({
          title: data.title,
          course_id: data.courseId,
          branch: data.branch || null,
          start_date: format(data.startDate, 'yyyy-MM-dd'),
          created_by: profile.id,
          allowed_admin_id: data.allowedAdminId || null,
        });

      if (error) throw error;

      toast({
        title: "Group created",
        description: "Course group has been created successfully",
      });

      form.reset();
      onGroupCreated();
    } catch (error) {
      console.error('Error creating group:', error);
      toast({
        title: "Error",
        description: "Failed to create group",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Course Group</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <GroupFormFields 
              control={form.control}
              courses={courses}
              admins={admins}
              coursesLoading={coursesLoading}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading || courses.length === 0}>
                {loading ? "Creating..." : "Create Group"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
