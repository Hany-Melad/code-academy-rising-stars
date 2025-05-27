
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { SessionCard } from "@/components/courses/SessionCard";
import { CreateSessionDialog } from "./CreateSessionDialog";
import { Course, Session } from "@/types/supabase";

interface SessionsTabProps {
  course: Course;
  sessions: Session[];
  onSessionCreated: (session: Session) => void;
  onCourseUpdated: (course: Course) => void;
}

export const SessionsTab = ({ course, sessions, onSessionCreated, onCourseUpdated }: SessionsTabProps) => {
  const [showSessionDialog, setShowSessionDialog] = useState(false);

  return (
    <>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Course Sessions</h2>
          <Button onClick={() => setShowSessionDialog(true)}>
            <Plus className="h-4 w-4 mr-2" /> Add Session
          </Button>
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
      </div>

      <CreateSessionDialog
        open={showSessionDialog}
        onOpenChange={setShowSessionDialog}
        course={course}
        sessions={sessions}
        onSessionCreated={onSessionCreated}
        onCourseUpdated={onCourseUpdated}
      />
    </>
  );
};
