
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase, ensureValidRole } from "@/lib/supabase";
import { Course, Profile, Session } from "@/types/supabase";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, UserPlus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

// Session form schema
const sessionFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  video_url: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  material_url: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
});

type SessionFormValues = z.infer<typeof sessionFormSchema>;

// Student assignment form schema
const studentAssignmentSchema = z.object({
  student_id: z.string().min(1, "Please enter a valid student ID"),
});

type StudentAssignmentValues = z.infer<typeof studentAssignmentSchema>;

const CourseDetailPage = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [enrolledStudents, setEnrolledStudents] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [openSessionDialog, setOpenSessionDialog] = useState(false);
  const [openAssignStudentDialog, setOpenAssignStudentDialog] = useState(false);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Session form
  const sessionForm = useForm<SessionFormValues>({
    resolver: zodResolver(sessionFormSchema),
    defaultValues: {
      title: "",
      video_url: "",
      material_url: "",
    },
  });

  // Student assignment form
  const assignmentForm = useForm<StudentAssignmentValues>({
    resolver: zodResolver(studentAssignmentSchema),
    defaultValues: {
      student_id: "",
    },
  });

  // Fetch course data
  useEffect(() => {
    const fetchCourseData = async () => {
      if (!courseId || !profile) return;
      
      try {
        setLoading(true);
        
        // Fetch course details
        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .select('*')
          .eq('id', courseId)
          .single();
        
        if (courseError) throw courseError;
        if (!courseData) {
          toast({
            title: "Course not found",
            description: "The requested course does not exist",
            variant: "destructive",
          });
          navigate('/admin');
          return;
        }
        
        setCourse(courseData);
        
        // Fetch course sessions
        const { data: sessionsData, error: sessionsError } = await supabase
          .from('sessions')
          .select('*')
          .eq('course_id', courseId)
          .order('order_number', { ascending: true });
        
        if (sessionsError) throw sessionsError;
        setSessions(sessionsData || []);
        
        // Fetch enrolled students
        const { data: enrollmentsData, error: enrollmentsError } = await supabase
          .from('student_courses')
          .select('*, student:profiles(*)')
          .eq('course_id', courseId);
        
        if (enrollmentsError) throw enrollmentsError;
        
        // Extract student profiles and ensure correct typing
        const students = enrollmentsData?.map(enrollment => {
          const student = enrollment.student as Profile;
          return {
            ...student,
            role: ensureValidRole(student.role)
          };
        }) || [];
        
        setEnrolledStudents(students);
        
      } catch (error) {
        console.error('Error fetching course data:', error);
        toast({
          title: "Error",
          description: "Failed to load course data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchCourseData();
  }, [courseId, profile, navigate, toast]);

  // Handle session form submission
  const handleSessionSubmit = async (data: SessionFormValues) => {
    if (!course) return;
    
    try {
      if (isEditing && currentSession) {
        // Update existing session
        const { error } = await supabase
          .from('sessions')
          .update({
            title: data.title,
            video_url: data.video_url || null,
            material_url: data.material_url || null,
          })
          .eq('id', currentSession.id);
        
        if (error) throw error;
        
        toast({
          title: "Session updated",
          description: "The session has been updated successfully",
        });
      } else {
        // Create new session
        const { error } = await supabase
          .from('sessions')
          .insert({
            course_id: course.id,
            title: data.title,
            video_url: data.video_url || null,
            material_url: data.material_url || null,
            order_number: sessions.length + 1, // Set order as next in sequence
          });
        
        if (error) throw error;
        
        // Update course total_sessions count
        await supabase
          .from('courses')
          .update({ total_sessions: course.total_sessions + 1 })
          .eq('id', course.id);
        
        // Update local course data
        setCourse({
          ...course,
          total_sessions: course.total_sessions + 1
        });
        
        toast({
          title: "Session created",
          description: "The session has been added to the course",
        });
      }
      
      // Refetch sessions
      const { data: updatedSessions, error: sessionsError } = await supabase
        .from('sessions')
        .select('*')
        .eq('course_id', course.id)
        .order('order_number', { ascending: true });
      
      if (sessionsError) throw sessionsError;
      setSessions(updatedSessions || []);
      
      // Reset form and close dialog
      sessionForm.reset();
      setOpenSessionDialog(false);
      setCurrentSession(null);
      setIsEditing(false);
      
    } catch (error) {
      console.error('Error handling session:', error);
      toast({
        title: "Error",
        description: isEditing 
          ? "Failed to update session" 
          : "Failed to create session",
        variant: "destructive",
      });
    }
  };

  // Handle student assignment
  const handleAssignStudent = async (data: StudentAssignmentValues) => {
    if (!course) return;
    
    try {
      // Check if student exists
      const { data: studentData, error: studentError } = await supabase
        .from('profiles')
        .select('*')
        .eq('unique_id', data.student_id)
        .eq('role', 'student')
        .single();
      
      if (studentError) {
        toast({
          title: "Student not found",
          description: "No student found with that ID",
          variant: "destructive",
        });
        return;
      }
      
      // Check if student is already enrolled
      const { data: existingEnrollment, error: enrollmentCheckError } = await supabase
        .from('student_courses')
        .select('*')
        .eq('student_id', studentData.id)
        .eq('course_id', course.id)
        .single();
      
      if (!enrollmentCheckError && existingEnrollment) {
        toast({
          title: "Already enrolled",
          description: "This student is already enrolled in this course",
          variant: "destructive",
        });
        return;
      }
      
      // Assign student to course
      const { error: assignError } = await supabase
        .from('student_courses')
        .insert({
          student_id: studentData.id,
          course_id: course.id,
          assigned_by: profile?.id,
          progress: 0,
        });
      
      if (assignError) throw assignError;
      
      // Add student to local state
      setEnrolledStudents([
        ...enrolledStudents, 
        {
          ...studentData,
          role: ensureValidRole(studentData.role)
        }
      ]);
      
      // Reset form and close dialog
      assignmentForm.reset();
      setOpenAssignStudentDialog(false);
      
      toast({
        title: "Student assigned",
        description: `${studentData.name} has been assigned to this course`,
      });
      
    } catch (error) {
      console.error('Error assigning student:', error);
      toast({
        title: "Error",
        description: "Failed to assign student to course",
        variant: "destructive",
      });
    }
  };

  // Handle session edit
  const handleEditSession = (session: Session) => {
    setCurrentSession(session);
    setIsEditing(true);
    
    sessionForm.reset({
      title: session.title,
      video_url: session.video_url || "",
      material_url: session.material_url || "",
    });
    
    setOpenSessionDialog(true);
  };

  // Handle session delete
  const handleDeleteSession = async (sessionId: string) => {
    if (!course) return;
    
    try {
      // Delete session
      const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('id', sessionId);
      
      if (error) throw error;
      
      // Update sessions list
      const filteredSessions = sessions.filter(s => s.id !== sessionId);
      setSessions(filteredSessions);
      
      // Update course total_sessions count
      await supabase
        .from('courses')
        .update({ total_sessions: course.total_sessions - 1 })
        .eq('id', course.id);
      
      // Update local course data
      setCourse({
        ...course,
        total_sessions: course.total_sessions - 1
      });
      
      toast({
        title: "Session removed",
        description: "The session has been removed from the course",
      });
      
    } catch (error) {
      console.error('Error deleting session:', error);
      toast({
        title: "Error",
        description: "Failed to delete session",
        variant: "destructive",
      });
    }
  };

  // Handle student removal
  const handleRemoveStudent = async (studentId: string) => {
    if (!course) return;
    
    try {
      // Remove student enrollment
      const { error } = await supabase
        .from('student_courses')
        .delete()
        .eq('student_id', studentId)
        .eq('course_id', course.id);
      
      if (error) throw error;
      
      // Update enrolled students list
      setEnrolledStudents(enrolledStudents.filter(s => s.id !== studentId));
      
      toast({
        title: "Student removed",
        description: "The student has been removed from this course",
      });
      
    } catch (error) {
      console.error('Error removing student:', error);
      toast({
        title: "Error",
        description: "Failed to remove student from course",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[80vh]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-t-academy-blue border-r-transparent border-b-academy-orange border-l-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-lg text-gray-600">Loading course data...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {course && (
        <div className="space-y-8">
          {/* Header */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <button 
                onClick={() => navigate('/admin')}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                ← Back to Dashboard
              </button>
            </div>
            <h1 className="text-3xl font-bold mb-1">{course.title}</h1>
            {course.description && (
              <p className="text-gray-600 mb-2">{course.description}</p>
            )}
            <div className="flex flex-wrap gap-2 items-center text-sm text-gray-500">
              <span>Created: {new Date(course.created_at).toLocaleDateString()}</span>
              <span>•</span>
              <span>Sessions: {course.total_sessions}</span>
              <span>•</span>
              <span>Students: {enrolledStudents.length}</span>
            </div>
          </div>
          
          {/* Tabs */}
          <Tabs defaultValue="sessions" className="space-y-6">
            <TabsList>
              <TabsTrigger value="sessions">Sessions</TabsTrigger>
              <TabsTrigger value="students">Students</TabsTrigger>
            </TabsList>
            
            {/* Sessions Tab */}
            <TabsContent value="sessions" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Course Sessions</h2>
                <Button onClick={() => {
                  setIsEditing(false);
                  setCurrentSession(null);
                  sessionForm.reset({
                    title: "",
                    video_url: "",
                    material_url: "",
                  });
                  setOpenSessionDialog(true);
                }}>
                  <Plus className="w-4 h-4 mr-2" /> Add Session
                </Button>
              </div>
              
              {sessions.length > 0 ? (
                <div className="space-y-4">
                  {sessions.map((session, index) => (
                    <Card key={session.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="bg-gray-200 flex items-center justify-center w-10 h-10 rounded-full">
                              <span className="font-medium">{index + 1}</span>
                            </div>
                            <div>
                              <h3 className="font-medium text-lg">{session.title}</h3>
                              <div className="flex gap-4 text-sm text-gray-500">
                                {session.video_url && (
                                  <a 
                                    href={session.video_url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline"
                                  >
                                    Video
                                  </a>
                                )}
                                {session.material_url && (
                                  <a 
                                    href={session.material_url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline"
                                  >
                                    Materials
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleEditSession(session)}
                            >
                              <Edit className="w-4 h-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-red-500 hover:text-red-700"
                              onClick={() => handleDeleteSession(session.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                  <h3 className="font-medium text-gray-900 mb-1">No sessions yet</h3>
                  <p className="text-gray-600 mb-4">
                    This course doesn't have any sessions yet. Add your first session to get started.
                  </p>
                  <Button onClick={() => setOpenSessionDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" /> Add First Session
                  </Button>
                </div>
              )}
            </TabsContent>
            
            {/* Students Tab */}
            <TabsContent value="students" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Enrolled Students</h2>
                <Button onClick={() => setOpenAssignStudentDialog(true)}>
                  <UserPlus className="w-4 h-4 mr-2" /> Assign Student
                </Button>
              </div>
              
              {enrolledStudents.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Points</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {enrolledStudents.map((student) => (
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
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-red-500 hover:text-red-700"
                              onClick={() => handleRemoveStudent(student.id)}
                            >
                              Remove
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                  <h3 className="font-medium text-gray-900 mb-1">No students yet</h3>
                  <p className="text-gray-600 mb-4">
                    This course doesn't have any students enrolled yet. Assign students to get started.
                  </p>
                  <Button onClick={() => setOpenAssignStudentDialog(true)}>
                    <UserPlus className="w-4 h-4 mr-2" /> Assign Student
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
          
          {/* Add Session Dialog */}
          <Dialog open={openSessionDialog} onOpenChange={setOpenSessionDialog}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>
                  {isEditing ? 'Edit Session' : 'Add New Session'}
                </DialogTitle>
              </DialogHeader>
              <Form {...sessionForm}>
                <form onSubmit={sessionForm.handleSubmit(handleSessionSubmit)} className="space-y-4">
                  <FormField
                    control={sessionForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Session Title</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Introduction to Variables" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={sessionForm.control}
                    name="video_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Video URL (Optional)</FormLabel>
                        <FormControl>
                          <Input {...field} type="url" placeholder="https://youtube.com/watch?v=..." />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={sessionForm.control}
                    name="material_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Materials URL (Optional)</FormLabel>
                        <FormControl>
                          <Input {...field} type="url" placeholder="https://drive.google.com/..." />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <DialogFooter>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setOpenSessionDialog(false);
                        setIsEditing(false);
                        setCurrentSession(null);
                        sessionForm.reset();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">
                      {isEditing ? 'Save Changes' : 'Add Session'}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          
          {/* Assign Student Dialog */}
          <Dialog open={openAssignStudentDialog} onOpenChange={setOpenAssignStudentDialog}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Assign Student to Course</DialogTitle>
              </DialogHeader>
              <Form {...assignmentForm}>
                <form onSubmit={assignmentForm.handleSubmit(handleAssignStudent)} className="space-y-4">
                  <FormField
                    control={assignmentForm.control}
                    name="student_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Student ID</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter 4-digit student ID" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <DialogFooter>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setOpenAssignStudentDialog(false);
                        assignmentForm.reset();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">Assign Student</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </DashboardLayout>
  );
};

export default CourseDetailPage;
