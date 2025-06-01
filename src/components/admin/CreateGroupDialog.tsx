
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";

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
  const [courses, setCourses] = useState<Array<{id: string, title: string}>>([]);
  const [admins, setAdmins] = useState<Array<{id: string, name: string}>>([]);
  const [loading, setLoading] = useState(false);
  const [coursesLoading, setCoursesLoading] = useState(false);

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

  useEffect(() => {
    if (open && profile) {
      fetchCourses();
      fetchAdmins();
    }
  }, [open, profile]);

  const fetchCourses = async () => {
    if (!profile) return;

    try {
      setCoursesLoading(true);
      console.log('Fetching courses for admin:', profile.id);
      
      const { data, error } = await supabase
        .from('admin_courses')
        .select(`
          course:courses(id, title)
        `)
        .eq('admin_id', profile.id);

      if (error) throw error;

      console.log('Admin courses data:', data);

      const courseList = (data || [])
        .filter(item => item.course)
        .map(item => item.course as {id: string, title: string});

      console.log('Processed course list:', courseList);
      setCourses(courseList);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast({
        title: "Error",
        description: "Failed to load courses",
        variant: "destructive",
      });
    } finally {
      setCoursesLoading(false);
    }
  };

  const fetchAdmins = async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name')
        .eq('role', 'admin')
        .neq('id', profile.id);

      if (error) throw error;

      setAdmins(data || []);
    } catch (error) {
      console.error('Error fetching admins:', error);
    }
  };

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
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Group Title</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Web Development Batch 1" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="courseId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Course</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={coursesLoading ? "Loading courses..." : "Select a course"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="z-[100] bg-white border border-gray-200 shadow-lg">
                      {coursesLoading ? (
                        <SelectItem value="loading" disabled>
                          Loading courses...
                        </SelectItem>
                      ) : courses.length === 0 ? (
                        <SelectItem value="no-courses" disabled>
                          No courses available. Create a course first in the admin dashboard.
                        </SelectItem>
                      ) : (
                        courses.map((course) => (
                          <SelectItem key={course.id} value={course.id}>
                            {course.title}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="branch"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Branch (Optional)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Main Campus" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Start Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date < new Date(new Date().setHours(0, 0, 0, 0))
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="allowedAdminId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Co-Admin (Optional)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a co-admin" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="z-[100] bg-white border border-gray-200 shadow-lg">
                      {admins.length === 0 ? (
                        <SelectItem value="no-admins" disabled>
                          No other admins available
                        </SelectItem>
                      ) : (
                        admins.map((admin) => (
                          <SelectItem key={admin.id} value={admin.id}>
                            {admin.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
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
