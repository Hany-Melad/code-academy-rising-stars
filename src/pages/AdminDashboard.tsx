
import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { AdminCourseCard } from "@/components/courses/CourseCardWithAdmin";
import { useAuth } from "@/contexts/AuthContext";
import { supabase, ensureValidRole } from "@/lib/supabase";
import { Course, Profile } from "@/types/supabase";
import { Book, Users, Plus, UserPlus } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { z } from "zod";

// Course form schema
const courseFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
});

type CourseFormValues = z.infer<typeof courseFormSchema>;

const AdminDashboard = () => {
  const { profile, user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [dataFetched, setDataFetched] = useState(false);
  const [openCourseDialog, setOpenCourseDialog] = useState(false);
  const [totalGroups, setTotalGroups] = useState(0);

  // Course form setup
  const form = useForm<CourseFormValues>({
    resolver: zodResolver(courseFormSchema),
    defaultValues: {
      title: "",
      description: "",
    },
  });

  useEffect(() => {
    console.log("AdminDashboard useEffect triggered");
    console.log("Auth loading:", authLoading);
    console.log("User:", user);
    console.log("Profile:", profile);
    console.log("Data fetched:", dataFetched);

    // Don't fetch if auth is still loading or data already fetched
    if (authLoading || dataFetched) {
      console.log("Skipping fetch - auth loading or data already fetched");
      return;
    }

    // If no user or profile, wait
    if (!user || !profile) {
      console.log("No user or profile found, waiting...");
      return;
    }

    const fetchAdminDashboardData = async () => {
      try {
        console.log("Starting admin dashboard data fetch for profile:", profile.id);
        setLoading(true);
        
        // Fetch courses created by this admin
        console.log("Fetching admin courses...");
        const { data: adminCoursesData, error: adminCoursesError } = await supabase
          .from('admin_courses')
          .select(`
            course:courses(*)
          `)
          .eq('admin_id', profile.id);
        
        if (adminCoursesError) {
          console.error("Error fetching admin courses:", adminCoursesError);
          throw adminCoursesError;
        }
        
        console.log("Admin courses data:", adminCoursesData);
        const adminCourses = (adminCoursesData || [])
          .filter(item => item.course)
          .map(item => item.course as Course);
        
        setCourses(adminCourses);
        
        // Fetch all students
        console.log("Fetching students...");
        const { data: studentsData, error: studentsError } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'student')
          .order('created_at', { ascending: false });
        
        if (studentsError) {
          console.error("Error fetching students:", studentsError);
          throw studentsError;
        }
        
        console.log("Students data:", studentsData);
        
        // Ensure correct typing for roles
        const typedStudents = (studentsData || []).map(student => ({
          ...student,
          role: ensureValidRole(student.role)
        }));
        
        setStudents(typedStudents);

        // Fetch groups count for this admin
        const { data: groupsData, error: groupsError } = await supabase
          .from('course_groups')
          .select('id', { count: 'exact' })
          .or(`created_by.eq.${profile.id},allowed_admin_id.eq.${profile.id}`);
        
        if (groupsError) {
          console.error("Error fetching groups:", groupsError);
        } else {
          setTotalGroups(groupsData?.length || 0);
        }
        
        setDataFetched(true);
        console.log("Admin dashboard data fetch completed successfully");
        
      } catch (error) {
        console.error('Error fetching admin dashboard data:', error);
        toast({
          title: "Error",
          description: "Failed to load dashboard data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchAdminDashboardData();
  }, [profile, user, authLoading, dataFetched, toast]);

  // Handle course creation
  const handleCreateCourse = async (data: CourseFormValues) => {
    try {
      console.log("Creating course with data:", data);
      
      // Create the course
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .insert({
          title: data.title,
          description: data.description || null,
          total_sessions: 0,
        })
        .select()
        .single();
      
      if (courseError) throw courseError;
      
      // Create the admin-course relationship
      const { error: adminCourseError } = await supabase
        .from('admin_courses')
        .insert({
          admin_id: profile!.id,
          course_id: courseData.id,
        });
      
      if (adminCourseError) throw adminCourseError;
      
      // Refetch courses data
      const { data: adminCoursesData, error: fetchError } = await supabase
        .from('admin_courses')
        .select(`
          course:courses(*)
        `)
        .eq('admin_id', profile!.id);
      
      if (fetchError) throw fetchError;
      
      const adminCourses = (adminCoursesData || [])
        .filter(item => item.course)
        .map(item => item.course as Course);
      
      setCourses(adminCourses);
      setOpenCourseDialog(false);
      form.reset();
      
      toast({
        title: "Course created",
        description: "Your course was created successfully",
      });
    } catch (error) {
      console.error('Error creating course:', error);
      toast({
        title: "Error",
        description: "Failed to create course",
        variant: "destructive",
      });
    }
  };

  // Show loading state
  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[80vh]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-t-academy-blue border-r-transparent border-b-academy-orange border-l-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-lg text-gray-600">Loading dashboard data...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-1">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage your courses, groups and track progress</p>
          </div>
          <div className="flex gap-2">
            <Button 
              className="bg-academy-blue hover:bg-blue-600"
              onClick={() => setOpenCourseDialog(true)}
            >
              <Plus className="w-4 h-4 mr-2" /> Add Course
            </Button>
            <Button variant="outline" asChild>
              <Link to="/admin/groups">
                <UserPlus className="w-4 h-4 mr-2" /> Manage Groups
              </Link>
            </Button>
          </div>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard 
            title="My Courses"
            value={courses.length}
            icon={Book}
            colorVariant="blue"
          />
          <StatsCard 
            title="Total Students"
            value={students.length}
            icon={Users}
            colorVariant="orange"
          />
          <StatsCard 
            title="My Groups"
            value={totalGroups}
            icon={UserPlus}
            colorVariant="purple"
          />
          <StatsCard 
            title="Active Students"
            value={students.filter(s => s.total_points > 0).length}
            icon={Users}
            description="Students with activity"
            colorVariant="green"
          />
        </div>
        
        {/* Recent Students */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Recent Students</h2>
            <Button variant="outline" asChild>
              <Link to="/admin/students">View All</Link>
            </Button>
          </div>
          
          {students.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Points</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students.slice(0, 5).map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{student.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{student.unique_id || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{student.total_points}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(student.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
              <h3 className="font-medium text-gray-900 mb-1">No students yet</h3>
              <p className="text-gray-600">
                There are no students registered in the system.
              </p>
            </div>
          )}
        </div>
        
        {/* My Courses */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">My Courses</h2>
            <Button variant="outline" asChild>
              <Link to="/admin/courses">View All</Link>
            </Button>
          </div>
          
          {courses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.slice(0, 3).map((course) => (
                <AdminCourseCard 
                  key={course.id} 
                  course={course}
                />
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
              <h3 className="font-medium text-gray-900 mb-1">No courses yet</h3>
              <p className="text-gray-600">
                Create your first course to get started.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Create Course Dialog */}
      <Dialog open={openCourseDialog} onOpenChange={setOpenCourseDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Course</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCreateCourse)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course Title</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Introduction to Coding" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="A brief description of the course content and objectives"
                        rows={4}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpenCourseDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Course</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminDashboard;
