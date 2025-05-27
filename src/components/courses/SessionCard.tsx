
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Lock, Video, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import type { Tables } from '@/integrations/supabase/types';

type Session = Tables<'sessions'>;
type StudentSession = Tables<'student_sessions'>;

interface SessionCardProps {
  session: Session;
  studentSession?: StudentSession;
  isLocked?: boolean;
  courseId: string;
  isAdmin?: boolean;
  isVisible?: boolean;
}

export function SessionCard({ 
  session, 
  studentSession, 
  isLocked = false, 
  courseId, 
  isAdmin = false,
  isVisible = true 
}: SessionCardProps) {
  const isCompleted = studentSession?.completed || false;
  const hasVideo = Boolean(session.video_url);
  const hasMaterials = Boolean(session.material_url);

  // For students, session is accessible if it's visible, not locked, and has video content
  // For admins, they can always access sessions
  const sessionVisible = session.visible !== undefined ? session.visible : true;
  const sessionLocked = session.locked !== undefined ? session.locked : false;
  
  const canAccess = isAdmin || (sessionVisible && !sessionLocked && hasVideo);
  const showAsAccessible = isAdmin || (sessionVisible && !sessionLocked && hasVideo);

  return (
    <Card className={cn("overflow-hidden transition-all", {
      "hover:shadow-md": canAccess,
      "opacity-75": !canAccess,
    })}>
      <CardHeader className={cn("pb-2", {
        "bg-green-50": isCompleted,
        "bg-academy-lightBlue": canAccess && !isCompleted && showAsAccessible,
        "bg-gray-100": !canAccess,
      })}>
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">Session {session.order_number}</CardTitle>
              {isAdmin && (
                <div className="flex gap-1">
                  {!sessionVisible && (
                    <Badge variant="outline" className="text-xs">
                      <EyeOff className="h-3 w-3 mr-1" />
                      Hidden
                    </Badge>
                  )}
                  {sessionLocked && (
                    <Badge variant="destructive" className="text-xs">
                      <Lock className="h-3 w-3 mr-1" />
                      Locked
                    </Badge>
                  )}
                  {!hasVideo && (
                    <Badge variant="outline" className="text-xs">
                      <Eye className="h-3 w-3 mr-1" />
                      No Video
                    </Badge>
                  )}
                </div>
              )}
            </div>
            <CardDescription>
              {session.title}
            </CardDescription>
          </div>
          {isCompleted ? (
            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
              Completed
            </Badge>
          ) : (
            !canAccess && (
              <Lock className="h-4 w-4 text-gray-400" />
            )
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="flex items-center gap-4 text-sm text-gray-500">
          {hasVideo && (
            <div className="flex items-center">
              <Video className="h-4 w-4 mr-1" />
              <span>Video Lesson</span>
            </div>
          )}
          
          {hasMaterials && (
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 mr-1" />
              <span>Materials</span>
            </div>
          )}

          {!hasVideo && !hasMaterials && (
            <span className="text-orange-500">No content added yet</span>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-2">
        <Button 
          variant="default"
          size="sm"
          className={cn({
            "bg-academy-blue hover:bg-blue-600": isCompleted,
            "bg-academy-orange hover:bg-orange-600": canAccess && !isCompleted && showAsAccessible,
            "bg-gray-300 cursor-not-allowed": !canAccess,
          })}
          disabled={!canAccess}
          asChild={canAccess}
        >
          {!canAccess ? (
            <span>
              {!sessionVisible ? "Hidden" : 
               sessionLocked ? "Locked" : 
               !hasVideo ? "No Content" : "Not Available"}
            </span>
          ) : (
            <Link to={isAdmin ? `/admin/courses/${courseId}/sessions/${session.id}` : `/courses/${courseId}/sessions/${session.id}`}>
              {isAdmin ? "Manage Session" : isCompleted ? "Review Session" : "Start Session"}
            </Link>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
