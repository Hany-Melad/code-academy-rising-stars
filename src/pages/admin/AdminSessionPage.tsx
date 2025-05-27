
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QuizManager } from "@/components/quizzes/QuizManager";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Save, Eye, EyeOff, Lock, Unlock } from "lucide-react";
import type { Tables } from '@/integrations/supabase/types';

type Session = Tables<'sessions'>;
type Course = Tables<'courses'>;

const AdminSessionPage = () => {
  const { courseId, sessionId } = useParams<{ courseId: string; sessionId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [session, setSession] = useState<Session | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    video_url: '',
    material_url: '',
    visible: true,
    locked: false
  });

  useEffect(() => {
    const fetchSessionData = async () => {
      try {
        if (!courseId || !sessionId) return;

        // Fetch session details
        const { data: sessionData, error: sessionError } = await supabase
          .from('sessions')
          .select('*')
          .eq('id', sessionId)
          .eq('course_id', courseId)
          .single();

        if (sessionError) throw sessionError;
        setSession(sessionData);
        setEditForm({
          title: sessionData.title,
          video_url: sessionData.video_url || '',
          material_url: sessionData.material_url || '',
          visible: sessionData.visible,
          locked: sessionData.locked
        });

        // Fetch course details
        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .select('*')
          .eq('id', courseId)
          .single();

        if (courseError) throw courseError;
        setCourse(courseData);

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
  }, [courseId, sessionId, toast]);

  const handleSaveSession = async () => {
    if (!session || saving) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('sessions')
        .update({
          title: editForm.title.trim(),
          video_url: editForm.video_url.trim() || null,
          material_url: editForm.material_url.trim() || null,
          visible: editForm.visible,
          locked: editForm.locked,
        })
        .eq('id', session.id);

      if (error) throw error;

      // Update course total_sessions count based on sessions with video content
      const { data: sessionsCount, error: countError } = await supabase
        .from('sessions')
        .select('id', { count: 'exact' })
        .eq('course_id', courseId)
        .not('video_url', 'is', null);

      if (countError) throw countError;

      const { error: courseUpdateError } = await supabase
        .from('courses')
        .update({ total_sessions: sessionsCount.length })
        .eq('id', courseId);

      if (courseUpdateError) throw courseUpdateError;

      toast({
        title: "Session Updated",
        description: "Session details have been saved successfully.",
      });

      // Refresh session data
      const { data: updatedSession } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (updatedSession) {
        setSession(updatedSession);
      }

    } catch (error) {
      console.error('Error saving session:', error);
      toast({
        title: "Error",
        description: "Failed to save session.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
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
          <p className="text-gray-600 mb-6">The session you're looking for doesn't exist.</p>
          <Button onClick={() => navigate(`/admin/courses/${courseId}`)}>
            Back to Course
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-1">Manage Session</h1>
            <p className="text-muted-foreground">
              {course.title} - Session {session.order_number}
            </p>
          </div>
          <Button 
            onClick={() => navigate(`/admin/courses/${courseId}`)} 
            variant="outline"
          >
            Back to Course
          </Button>
        </div>

        <Tabs defaultValue="details" className="space-y-6">
          <TabsList>
            <TabsTrigger value="details">Session Details</TabsTrigger>
            <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
          </TabsList>

          <TabsContent value="details">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Edit Form */}
              <Card>
                <CardHeader>
                  <CardTitle>Session Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Session Title</Label>
                    <Input
                      id="title"
                      value={editForm.title}
                      onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                      placeholder="Enter session title"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="video_url">Video URL</Label>
                    <Input
                      id="video_url"
                      value={editForm.video_url}
                      onChange={(e) => setEditForm({...editForm, video_url: e.target.value})}
                      placeholder="Enter video URL (YouTube, Vimeo, direct video file)"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="material_url">Material URL</Label>
                    <Input
                      id="material_url"
                      value={editForm.material_url}
                      onChange={(e) => setEditForm({...editForm, material_url: e.target.value})}
                      placeholder="Enter material URL (PDF, documents, etc.)"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="visible"
                        checked={editForm.visible}
                        onCheckedChange={(checked) => setEditForm({...editForm, visible: checked})}
                      />
                      <Label htmlFor="visible" className="flex items-center gap-2">
                        {editForm.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        Visible to Students
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="locked"
                        checked={editForm.locked}
                        onCheckedChange={(checked) => setEditForm({...editForm, locked: checked})}
                      />
                      <Label htmlFor="locked" className="flex items-center gap-2">
                        {editForm.locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                        Locked
                      </Label>
                    </div>
                  </div>

                  <Button 
                    onClick={handleSaveSession}
                    disabled={saving}
                    className="w-full"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Preview */}
              <Card>
                <CardHeader>
                  <CardTitle>Session Preview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Session {session.order_number}</Badge>
                    {editForm.visible ? (
                      <Badge className="bg-green-100 text-green-800">Visible</Badge>
                    ) : (
                      <Badge variant="secondary">Hidden</Badge>
                    )}
                    {editForm.locked && (
                      <Badge variant="destructive">Locked</Badge>
                    )}
                  </div>
                  
                  <h3 className="text-lg font-semibold">{editForm.title}</h3>

                  {editForm.video_url && (
                    <div className="space-y-2">
                      <Label>Video Preview</Label>
                      <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                        {editForm.video_url.includes('youtube.com') || editForm.video_url.includes('youtu.be') ? (
                          <div className="text-center p-4">
                            <p className="text-sm text-gray-600 mb-2">YouTube Video</p>
                            <a 
                              href={editForm.video_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              View on YouTube
                            </a>
                          </div>
                        ) : editForm.video_url.includes('vimeo.com') ? (
                          <div className="text-center p-4">
                            <p className="text-sm text-gray-600 mb-2">Vimeo Video</p>
                            <a 
                              href={editForm.video_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              View on Vimeo
                            </a>
                          </div>
                        ) : (
                          <video
                            src={editForm.video_url}
                            controls
                            className="w-full h-full rounded-lg"
                            preload="metadata"
                          >
                            Your browser does not support the video tag.
                          </video>
                        )}
                      </div>
                    </div>
                  )}

                  {editForm.material_url && (
                    <div>
                      <Label>Materials</Label>
                      <Button asChild variant="outline" className="w-full mt-2">
                        <a href={editForm.material_url} target="_blank" rel="noopener noreferrer">
                          View Materials
                        </a>
                      </Button>
                    </div>
                  )}

                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Status:</strong> {
                        !editForm.visible ? 'Hidden from students' :
                        editForm.locked ? 'Visible but locked' :
                        !editForm.video_url ? 'Visible but no video content' :
                        'Available to students'
                      }
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="quizzes">
            <QuizManager sessionId={sessionId!} />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AdminSessionPage;
