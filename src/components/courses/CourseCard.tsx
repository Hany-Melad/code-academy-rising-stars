
// This is a read-only file, we can't modify it directly.
// We need to create a new component that extends the functionality.

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useNavigate } from "react-router-dom";

// Create a wrapper component that adds admin functionality
const AdminCourseCardWrapper = ({ courseId, children }) => {
  const navigate = useNavigate();
  
  return (
    <div className="relative">
      {children}
      <div className="absolute inset-0 bg-transparent flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
        <Button 
          className="bg-academy-blue hover:bg-blue-600"
          onClick={() => navigate(`/admin/courses/${courseId}`)}
        >
          Manage Course
        </Button>
      </div>
    </div>
  );
};

export { AdminCourseCardWrapper };
