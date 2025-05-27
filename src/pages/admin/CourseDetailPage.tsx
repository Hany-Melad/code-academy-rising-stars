import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { SessionCard } from "@/components/courses/SessionCard";
import { supabase, ensureValidRole } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Plus, Search, User, XCircle } from "lucide-react";
import { Course, Profile, Session } from "@/types/supabase";

const CourseDetailPage = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [course, setCourse] = useState<Course | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolledStudents, setEnrolledStudents] = useState<Profile[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [showSessionDialog, setShowSessionDialog] = useState(false);
  const [showStudentDialog, setShowStudentDialog] = useState(false);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [sessionForm, setSessionForm] = useState({
    title: "",
    video_url: "",
    material_url: ""
  });
  
  // Fetch course details, sessions, and enrolled students
  useEffect(() => {
    const fetchCourseDetails = async () => {
      try {
        if (!courseId) return;
        
        console.log("Fetching course details for:", courseId);
        
        // Fetch course details
        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .select('*')
          .eq('id', courseId)
          .single();
        
        if (courseError) {
          console.error("Course fetch error:", courseError);
          throw courseError;
        }
        setCourse(courseData);
        
        // Fetch sessions
        const { data: sessionsData, error: sessionsError } = await supabase
          .from('sessions')
          .select('*')
          .eq('course_id', courseId)
          .order('order_number', { ascending: true });
        
        if (sessionsError) {
          console.error("Sessions fetch error:", sessionsError);
          throw sessionsError;
        }
        setSessions(sessionsData || []);
        
        // Fetch enrolled students
        const { data: enrolledData, error: enrolledError } = await supabase
          .from('student_courses')
          .select('student_id')
          .eq('course_id', courseId);
        
        if (enrolledError) {
          console.error("Enrolled students fetch error:", enrolledError);
          throw enrolledError;
        }
        
        if (enrolledData && enrolledData.length > 0) {
          const studentIds = enrolledData.map(sc => sc.student_id);
          
          const { data: studentsData, error: studentsError } = await supabase
            .from('profiles')
            .select('*')
            .in('id', studentIds);
          
          if (studentsError) {
            console.error("Students data fetch error:", studentsError);
            throw studentsError;
          }
          
          // Ensure correct typing for roles
          const typedStudents = (studentsData || []).map(student => ({
            ...student,
            role: ensureValidRole(student.role)
          }));
          
          setEnrolledStudents(typedStudents);
        }
        
      } catch (error) {
        console.error('Error fetching course details:', error);
        toast({
          title: "Error",
          description: "Failed to load course details.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchCourseDetails();
  }, [courseId, toast]);
  
  // Handle session creation
  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!sessionForm.title.trim()) {
      toast({
        title: "Error",
        description: "Session title is required.",
        variant: "destructive",
      });
      return;
    }
    
    setIsCreatingSession(true);
    
    try {
      if (!course) return;
      
      console.log("Creating session with data:", sessionForm);
      
      const nextOrderNumber = sessions.length + 1;
      
      const { data, error } = await supabase
        .from('sessions')
        .insert({
          course_id: course.id,
          title: sessionForm.title.trim(),
          video_url: sessionForm.video_url.trim() || null,
          material_url: sessionForm.material_url.trim() || null,
          order_number: nextOrderNumber,
          visible: true,
          locked: false,
        })
        .select('*')
        .single();
      
      if (error) {
        console.error("Session creation error:", error);
        throw error;
      }
      
      console.log("Session created successfully:", data);
      
      // Ensure the data has all required properties by casting to Session type
      const newSession: Session = {
        id: data.id,
        course_id: data.course_id,
        title: data.title,
        order_number: data.order_number,
        video_url: data.video_url,
        material_url: data.material_url,
        created_at: data.created_at,
        visible: data.visible ?? true,
        locked: data.locked ?? false,
      };
      
      // Update sessions list
      setSessions([...sessions, newSession]);
      
      // Update course total_sessions count
      const newTotalSessions = sessions.length + 1;
      const { error: courseUpdateError } = await supabase
        .from('courses')
        .update({ total_sessions: newTotalSessions })
        .eq('id', course.id);
      
      if (courseUpdateError) {
        console.error("Error updating course session count:", courseUpdateError);
      } else {
        // Update local course state
        setCourse({ ...course, total_sessions: newTotalSessions });
      }
      
      setSessionForm({ title: "", video_url: "", material_url: "" });
      setShowSessionDialog(false);
      
      toast({
        title: "Success",
        description: "Session created successfully!",
      });
    } catch (error) {
      console.error('Error creating session:', error);
      toast({
        title: "Error",
        description: `Failed to create session: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setIsCreatingSession(false);
    }
  };
  
  // Search students to enroll
  const searchStudents = async () => {
    try {
      if (!searchTerm.trim()) {
        setSearchResults([]);
        return;
      }
      
      console.log("Searching for students with term:", searchTerm);
      
      // Search by name or unique_id with case-insensitive matching
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
      
      // Ensure correct typing for roles
      const typedStudents = (data || []).map(student => ({
        ...student,
        role: ensureValidRole(student.role)
      }));
      
      // Filter out already enrolled students
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
      if (!course) return;
      
      const { error } = await supabase
        .from('student_courses')
        .insert({
          student_id: studentId,
          course_id: course.id,
          progress: 0,
        });
      
      if (error) throw error;
      
      // Find the student in search results and add to enrolled
      const studentToEnroll = searchResults.find(s => s.id === studentId);
      if (studentToEnroll) {
        setEnrolledStudents([...enrolledStudents, studentToEnroll]);
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
  
  const removeStudent = async (studentId: string) => {
    try {
      if (!course) return;
      
      const { error } = await supabase
        .from('student_courses')
        .delete()
        .eq('course_id', course.id)
        .eq('student_id', studentId);
      
      if (error) throw error;
      
      setEnrolledStudents(enrolledStudents.filter(s => s.id !== studentId));
      
      toast({
        title: "Success",
        description: "Student removed from course.",
      });
    } catch (error) {
      console.error('Error removing student:', error);
      toast({
        title: "Error",
        description: "Failed to remove student.",
        variant: "destructive",
      });
    }
  };
  
  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[80vh]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-academy-blue mx-auto mb-4" />
            <p className="text-lg text-gray-600">Loading course details...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }
  
  if (!course) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Course not found</h2>
          <p className="text-gray-600 mb-6">The course you're looking for doesn't exist or you don't have access.</p>
          <Button onClick={() => navigate('/admin')}>Return to Dashboard</Button>
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-1">{course.title}</h1>
            <p className="text-muted-foreground">
              {course.description || "No description provided"}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {course.total_sessions} {course.total_sessions === 1 ? 'session' : 'sessions'}
            </p>
          </div>
          <Button onClick={() => navigate('/admin')} variant="outline">
            Back to Dashboard
          </Button>
        </div>
        
        <Tabs defaultValue="sessions" className="w-full">
          <TabsList>
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
            <TabsTrigger value="students">Enrolled Students</TabsTrigger>
          </TabsList>
          
          <TabsContent value="sessions" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Course Sessions</h2>
              <Dialog open={showSessionDialog} onOpenChange={setShowSessionDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" /> Add Session
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Session</DialogTitle>
                    <DialogDescription>
                      Add a new learning session to this course.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <form onSubmit={handleCreateSession} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Session Title *</Label>
                      <Input
                        id="title"
                        placeholder="Enter session title"
                        value={sessionForm.title}
                        onChange={(e) => setSessionForm({...sessionForm, title: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="video_url">Video URL (optional)</Label>
                      <Input
                        id="video_url"
                        placeholder="Enter video URL"
                        value={sessionForm.video_url}
                        onChange={(e) => setSessionForm({...sessionForm, video_url: e.target.value})}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="material_url">Material URL (optional)</Label>
                      <Input
                        id="material_url"
                        placeholder="Enter material URL"
                        value={sessionForm.material_url}
                        onChange={(e) => setSessionForm({...sessionForm, material_url: e.target.value})}
                      />
                    </div>
                    
                    <DialogFooter>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setShowSessionDialog(false)}
                        disabled={isCreatingSession}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isCreatingSession}>
                        {isCreatingSession ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          "Create Session"
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            
            {sessions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sessions.map((session) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    courseId={course.id}
                    isAdmin={true}
                  />
                ))}
              </div>
            ) : (
              <Card className="bg-gray-50 border border-gray-200">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <h3 className="font-medium text-gray-900 mb-1">No sessions yet</h3>
                  <p className="text-gray-600 mb-4">
                    Add your first session to get started
                  </p>
                  <Button onClick={() => setShowSessionDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" /> Add First Session
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="students" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Enrolled Students</h2>
              <Dialog open={showStudentDialog} onOpenChange={setShowStudentDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" /> Add Students
                  </Button>
                </DialogTrigger>
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
                    <Button type="button" onClick={() => setShowStudentDialog(false)}>Close</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            
            {enrolledStudents.length > 0 ? (
              <div className="border rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {enrolledStudents.map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{student.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{student.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{student.unique_id || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-600 hover:text-red-900 hover:bg-red-50"
                            onClick={() => removeStudent(student.id)}
                          >
                            <XCircle className="h-4 w-4 mr-1" /> Remove
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <Card className="bg-gray-50 border border-gray-200">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <h3 className="font-medium text-gray-900 mb-1">No students enrolled</h3>
                  <p className="text-gray-600 mb-4">
                    Add students to this course to get started
                  </p>
                  <Button onClick={() => setShowStudentDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" /> Add Students
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default CourseDetailPage;
