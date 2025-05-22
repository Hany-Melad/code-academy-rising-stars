import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Book, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import type { Tables } from '@/integrations/supabase/types';

type Course = Tables<'courses'>;
type StudentCourse = Tables<'student_courses'>;

interface CourseCardProps {
  course: Course;
  studentCourse?: StudentCourse;
  isAdmin?: boolean;
}

export function CourseCard({ course, studentCourse, isAdmin = false }: CourseCardProps) {
  const isEnrolled = !!studentCourse;
  const progress = studentCourse?.progress || 0;
  const progressPercentage = (progress / course.total_sessions) * 100;
  const isCompleted = progressPercentage === 100;

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardHeader className={cn("pb-2", {
        "bg-academy-lightOrange": isEnrolled && !isCompleted,
        "bg-academy-lightBlue": !isEnrolled,
        "bg-green-50": isEnrolled && isCompleted,
      })}>
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <CardTitle className="text-xl">{course.title}</CardTitle>
            <CardDescription className="line-clamp-2">
              {course.description || "No description available"}
            </CardDescription>
          </div>
          {isEnrolled && (
            <Badge variant={isCompleted ? "default" : "outline"} className={cn({
              "bg-green-100 text-green-800 hover:bg-green-100": isCompleted,
              "border-academy-orange text-academy-orange": !isCompleted,
            })}>
              {isCompleted ? "Completed" : "In Progress"}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Book className="h-4 w-4" />
          <span>{course.total_sessions} Sessions</span>
        </div>

        {isEnrolled && (
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1">
              <span>Progress</span>
              <span className="font-medium">{Math.round(progressPercentage)}%</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className={cn("h-full rounded-full", {
                  "bg-academy-orange": progressPercentage < 100,
                  "bg-green-500": progressPercentage >= 100,
                })} 
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>
        )}
        
        {isAdmin && (
          <div className="mt-4">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>Created: {new Date(course.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className={cn("pt-2 flex", {
        "justify-between": isEnrolled,
        "justify-end": !isEnrolled,
      })}>
        {isEnrolled && (
          <div className="flex items-center text-sm">
            <CheckCircle className="h-4 w-4 text-academy-orange mr-1" />
            <span>
              {progress} / {course.total_sessions} sessions completed
            </span>
          </div>
        )}
        
        <Button 
          variant={isEnrolled ? "default" : "outline"}
          size="sm"
          className={cn({
            "bg-academy-orange hover:bg-orange-600": isEnrolled,
            "border-academy-blue text-academy-blue hover:bg-academy-lightBlue": !isEnrolled,
          })}
          asChild
        >
          <Link to={isAdmin ? `/admin/courses/${course.id}` : `/courses/${course.id}`}>
            {isEnrolled ? "Continue" : "View Course"}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
