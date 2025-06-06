
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Control } from "react-hook-form";

interface Course {
  id: string;
  title: string;
}

interface Admin {
  id: string;
  name: string;
}

interface GroupFormFieldsProps {
  control: Control<any>;
  courses: Course[];
  admins: Admin[];
  coursesLoading: boolean;
}

export const GroupFormFields = ({ control, courses, admins, coursesLoading }: GroupFormFieldsProps) => {
  return (
    <>
      <FormField
        control={control}
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
        control={control}
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
        control={control}
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
        control={control}
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
        control={control}
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
    </>
  );
};
