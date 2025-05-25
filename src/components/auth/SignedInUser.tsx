
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { useState } from "react";

export function SignedInUser() {
  const { signOut, isAdmin, profile } = useAuth();
  const navigate = useNavigate();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (isSigningOut) return;
    
    try {
      setIsSigningOut(true);
      await signOut();
      navigate("/");
    } catch (error) {
      console.error("Sign out error:", error);
    } finally {
      setIsSigningOut(false);
    }
  };

  const getDashboardPath = () => {
    return isAdmin ? "/admin" : "/dashboard";
  };

  return (
    <div className="w-full max-w-md">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900">Welcome back!</h2>
        <p className="text-sm text-gray-600 mt-2">
          You're signed in as {profile?.name || 'User'}
        </p>
      </div>
      
      <div className="space-y-4">
        <Button 
          onClick={() => navigate(getDashboardPath())} 
          className="w-full bg-academy-blue hover:bg-blue-600"
        >
          Go to {isAdmin ? "Admin" : "Student"} Dashboard
        </Button>
        
        <Button 
          variant="outline" 
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="w-full flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          {isSigningOut ? "Signing out..." : "Sign Out"}
        </Button>
      </div>
    </div>
  );
}
