
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";

export function SignedInUser() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="w-full max-w-md">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900">You're signed in!</h2>
        <p className="text-sm text-gray-600 mt-2">Welcome back to UPS Junior Coding Academy</p>
      </div>
      
      <div className="space-y-4">
        <Button 
          onClick={() => navigate("/dashboard")} 
          className="w-full bg-academy-blue hover:bg-blue-600"
        >
          Go to Dashboard
        </Button>
        
        <Button 
          variant="outline" 
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}
