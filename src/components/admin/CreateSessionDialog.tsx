
import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Course, Session } from "@/types/supabase";

interface CreateSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course: Course;
  sessions: Session[];
  onSessionCreated: (session: Session) => void;
  onCourseUpdated: (course: Course) => void;
}

export const CreateSessionDialog = ({ 
  open, 
  onOpenChange, 
  course, 
  sessions, 
  onSessionCreated, 
  onCourseUpdated 
}: CreateSessionDialogProps) => {
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [sessionForm, setSessionForm] = useState({
    title: "",
    video_url: "",
    material_url: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!sessionForm.title.trim()) {
      toast({
        title: "Error",
        description: "Session title is required.",
        variant: "destructive",
      });
      return;
    }
    
    setIsCreating(true);
    
    try {
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
      
      const newSession: Session = {
        id: data.id,
        course_id: data.course_id,
        title: data.title,
        order_number: data.order_number,
        video_url: data.video_url,
        material_url: data.material_url,
        created_at: data.created_at,
        visible: data.visible,
        locked: data.locked,
      };
      
      onSessionCreated(newSession);
      
      // Update course total_sessions count
      const newTotalSessions = sessions.length + 1;
      const { error: courseUpdateError } = await supabase
        .from('courses')
        .update({ total_sessions: newTotalSessions })
        .eq('id', course.id);
      
      if (courseUpdateError) {
        console.error("Error updating course session count:", courseUpdateError);
      } else {
        onCourseUpdated({ ...course, total_sessions: newTotalSessions });
      }
      
      setSessionForm({ title: "", video_url: "", material_url: "" });
      onOpenChange(false);
      
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
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Session</DialogTitle>
          <DialogDescription>
            Add a new learning session to this course.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
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
              onClick={() => onOpenChange(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? (
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
  );
};
