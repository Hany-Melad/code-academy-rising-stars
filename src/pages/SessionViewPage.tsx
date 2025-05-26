
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, PlayCircle, CheckCircle, Download, ArrowLeft } from "lucide-react";
import type { Tables } from '@/integrations/supabase/types';

type Session = Tables<'sessions'>;
type Course = Tables<'courses'>;
type StudentSession = Tables<'student_sessions'>;

const SessionViewPage = () => {
  const { courseId, sessionId } = useParams<{ courseId: string; sessionId: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [session, setSession] = useState<Session | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [studentSession, setStudentSession] = useState<StudentSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);

  useEffect(() => {
    const fetchSessionData = async () => {
      try {
        if (!courseId || !sessionId || !profile) return;

        // Check if student is enrolled first
        const { data: enrollmentData, error: enrollmentError } = await supabase
          .from('student_courses')
          .select('*')
          .eq('student_id', profile.id)
          .eq('course_id', courseId)
          .single();

        if (enrollmentError) {
          toast({
            title: "Access Denied",
            description: "You are not enrolled in this course.",
            variant: "destructive",
          });
          navigate('/dashboard');
          return;
        }

        // Fetch session details
        const { data: sessionData, error: sessionError } = await supabase
          .from('sessions')
          .select('*')
          .eq('id', sessionId)
          .eq('course_id', courseId)
          .single();

        if (sessionError) throw sessionError;
        
        // Check if session has video content and is visible to students
        if (!sessionData.video_url) {
          toast({
            title: "Session Not Available",
            description: "This session doesn't have video content available.",
            variant: "destructive",
          });
          navigate(`/courses/${courseId}`);
          return;
        }

        setSession(sessionData);

        // Fetch course details
        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .select('*')
          .eq('id', courseId)
          .single();

        if (courseError) throw courseError;
        setCourse(courseData);

        // Fetch student session progress
        const { data: studentSessionData, error: studentSessionError } = await supabase
          .from('student_sessions')
          .select('*')
          .eq('student_id', profile.id)
          .eq('session_id', sessionId)
          .maybeSingle();

        if (studentSessionError && studentSessionError.code !== 'PGRST116') {
          throw studentSessionError;
        }

        setStudentSession(studentSessionData);

      } catch (error) {
        console.error('Error fetching session data:', error);
        toast({
          title: "Error",
          description: "Failed to load session data.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSessionData();
  }, [courseId, sessionId, profile, navigate, toast]);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const progress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setVideoProgress(progress);
      
      // Auto-complete when video reaches 90%
      if (progress >= 90 && !studentSession?.completed && !completing) {
        handleCompleteSession();
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setVideoDuration(videoRef.current.duration);
    }
  };

  const handleCompleteSession = async () => {
    if (!profile || !session || completing) return;

    setCompleting(true);
    try {
      const points = 10;

      if (studentSession) {
        const { error } = await supabase
          .from('student_sessions')
          .update({
            completed: true,
            completed_at: new Date().toISOString(),
            earned_points: points,
          })
          .eq('id', studentSession.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('student_sessions')
          .insert({
            student_id: profile.id,
            session_id: session.id,
            completed: true,
            completed_at: new Date().toISOString(),
            earned_points: points,
          });

        if (error) throw error;
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          total_points: (profile.total_points || 0) + points,
        })
        .eq('id', profile.id);

      if (profileError) throw profileError;

      const { data: currentCourse, error: getCourseError } = await supabase
        .from('student_courses')
        .select('progress')
        .eq('student_id', profile.id)
        .eq('course_id', courseId)
        .single();

      if (getCourseError) throw getCourseError;

      const { error: progressError } = await supabase
        .from('student_courses')
        .update({
          progress: (currentCourse.progress || 0) + 1,
        })
        .eq('student_id', profile.id)
        .eq('course_id', courseId);

      if (progressError) throw progressError;

      toast({
        title: "Session Completed!",
        description: `You earned ${points} points for completing this session.`,
      });

      const { data: updatedStudentSession } = await supabase
        .from('student_sessions')
        .select('*')
        .eq('student_id', profile.id)
        .eq('session_id', sessionId)
        .single();

      setStudentSession(updatedStudentSession);

    } catch (error) {
      console.error('Error completing session:', error);
      toast({
        title: "Error",
        description: "Failed to mark session as complete.",
        variant: "destructive",
      });
    } finally {
      setCompleting(false);
    }
  };

  // Helper function to get embeddable video URL
  const getEmbeddableVideoUrl = (url: string) => {
    if (!url) return '';
    
    // YouTube URL conversion
    if (url.includes('youtube.com/watch?v=')) {
      const videoId = url.split('v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    
    // YouTube short URL conversion
    if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    
    // Vimeo URL conversion
    if (url.includes('vimeo.com/')) {
      const videoId = url.split('vimeo.com/')[1]?.split('?')[0];
      return `https://player.vimeo.com/video/${videoId}`;
    }
    
    // Return original URL for direct video files
    return url;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[80vh]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-academy-blue mx-auto mb-4" />
            <p className="text-lg text-gray-600">Loading session...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!session || !course) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Session not found</h2>
          <p className="text-gray-600 mb-6">The session you're looking for doesn't exist or you don't have access.</p>
          <Button onClick={() => navigate('/dashboard')}>Return to Dashboard</Button>
        </div>
      </DashboardLayout>
    );
  }

  const isCompleted = studentSession?.completed || false;
  const embeddableUrl = getEmbeddableVideoUrl(session.video_url || '');
  const isDirectVideo = session.video_url && (session.video_url.endsWith('.mp4') || session.video_url.endsWith('.webm') || session.video_url.endsWith('.ogg'));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/courses/${courseId}`)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Course
            </Button>
            <div>
              <h1 className="text-3xl font-bold mb-1">{session.title}</h1>
              <p className="text-muted-foreground">
                {course.title} - Session {session.order_number}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {isCompleted && (
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle className="w-4 h-4 mr-1" />
                Completed
              </Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Section */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PlayCircle className="w-5 h-5" />
                  Video Lesson
                </CardTitle>
              </CardHeader>
              <CardContent>
                {session.video_url ? (
                  <div className="space-y-4">
                    <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                      {isDirectVideo ? (
                        <video
                          ref={videoRef}
                          src={session.video_url}
                          controls
                          className="w-full h-full"
                          onTimeUpdate={handleTimeUpdate}
                          onLoadedMetadata={handleLoadedMetadata}
                          preload="metadata"
                        >
                          Your browser does not support the video tag.
                        </video>
                      ) : (
                        <iframe
                          src={embeddableUrl}
                          className="w-full h-full"
                          allowFullScreen
                          title={session.title}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        />
                      )}
                    </div>
                    {isDirectVideo && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Video Progress</span>
                          <span>{Math.round(videoProgress)}%</span>
                        </div>
                        <Progress value={videoProgress} />
                      </div>
                    )}
                    {!isCompleted && ((isDirectVideo && videoProgress >= 90) || !isDirectVideo) && (
                      <Button 
                        onClick={handleCompleteSession}
                        disabled={completing}
                        className="w-full"
                      >
                        {completing ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Marking as Complete...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Mark as Complete
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                    <p className="text-gray-500">No video available for this session</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Progress Card */}
            <Card>
              <CardHeader>
                <CardTitle>Your Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Session Progress</span>
                    <span>{isCompleted ? '100%' : Math.round(videoProgress)}%</span>
                  </div>
                  <Progress value={isCompleted ? 100 : videoProgress} />
                </div>
                {studentSession?.earned_points && (
                  <div className="text-center p-3 bg-yellow-50 rounded-lg">
                    <p className="text-sm font-medium text-yellow-800">
                      Points Earned: {studentSession.earned_points}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Materials */}
            {session.material_url && (
              <Card>
                <CardHeader>
                  <CardTitle>Session Materials</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button asChild variant="outline" className="w-full">
                    <a href={session.material_url} target="_blank" rel="noopener noreferrer" download>
                      <Download className="w-4 h-4 mr-2" />
                      Download Materials
                    </a>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SessionViewPage;
