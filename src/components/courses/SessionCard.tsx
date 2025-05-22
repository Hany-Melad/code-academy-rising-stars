
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Session, StudentSession } from "@/types/supabase";
import { CheckCircle, Lock, Video } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

interface SessionCardProps {
  session: Session;
  studentSession?: StudentSession;
  isLocked?: boolean;
  courseId: string;
  isAdmin?: boolean;
}

export function SessionCard({ session, studentSession, isLocked = false, courseId, isAdmin = false }: SessionCardProps) {
  const isCompleted = studentSession?.completed || false;

  return (
    <Card className={cn("overflow-hidden transition-all", {
      "hover:shadow-md": !isLocked,
      "opacity-75": isLocked,
    })}>
      <CardHeader className={cn("pb-2", {
        "bg-green-50": isCompleted,
        "bg-academy-lightBlue": !isLocked && !isCompleted,
        "bg-gray-100": isLocked,
      })}>
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <CardTitle className="text-lg">Session {session.order_number}</CardTitle>
            <CardDescription>
              {session.title}
            </CardDescription>
          </div>
          {isCompleted ? (
            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
              Completed
            </Badge>
          ) : (
            isLocked && (
              <Lock className="h-4 w-4 text-gray-400" />
            )
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          {session.video_url && (
            <div className="flex items-center">
              <Video className="h-4 w-4 mr-1" />
              <span>Video Lesson</span>
            </div>
          )}
          
          {session.material_url && (
            <div className="flex items-center ml-4">
              <CheckCircle className="h-4 w-4 mr-1" />
              <span>Materials</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-2">
        <Button 
          variant="default"
          size="sm"
          className={cn({
            "bg-academy-blue hover:bg-blue-600": isCompleted,
            "bg-academy-orange hover:bg-orange-600": !isCompleted && !isLocked,
            "bg-gray-300 cursor-not-allowed": isLocked,
          })}
          disabled={isLocked}
          asChild={!isLocked}
        >
          {isLocked ? (
            <span>Locked</span>
          ) : (
            <Link to={isAdmin ? `/admin/courses/${courseId}/sessions/${session.id}` : `/courses/${courseId}/sessions/${session.id}`}>
              {isCompleted ? "Review Session" : "Start Session"}
            </Link>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
