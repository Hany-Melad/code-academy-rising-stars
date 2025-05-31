import { ReactNode } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Logo } from "@/components/Logo";
import { Award, Book, Home, LogOut, Settings, Trophy, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { profile, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const studentMenuItems = [
    { title: "Dashboard", icon: Home, url: "/dashboard" },
    { title: "Courses", icon: Book, url: "/courses" },
    { title: "Leaderboard", icon: Trophy, url: "/leaderboard" },
    { title: "Profile", icon: User, url: "/profile" },
    { title: "My Certificates", icon: Award, url: "/StudentCertificatespage" },
  ];

  const adminMenuItems = [
    { title: "Dashboard", icon: Home, url: "/admin" },
    { title: "Manage Courses", icon: Book, url: "/admin/courses" },
    { title: "Manage Students", icon: User, url: "/admin/students" },
    { title: "Settings", icon: Settings, url: "/admin/settings" },
  ];

  const menuItems = isAdmin ? adminMenuItems : studentMenuItems;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <Sidebar>
          <SidebarHeader className="flex items-center justify-center py-6">
            <Logo />
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel className="text-muted-foreground text-sm mb-2">Navigation</SidebarGroupLabel>
              <div className="flex flex-col gap-2">
                {menuItems.map((item) => (
                  <Link key={item.title} to={item.url}>
                    <button className="w-full flex items-center gap-2 px-4 py-2 text-sm font-medium text-black bg-white-600 hover:bg-blue-200 rounded-xl transition">
                      <item.icon className="w-5 h-5" />
                      {item.title}
                    </button>
                  </Link>
                ))}
              </div>
            </SidebarGroup>

            <div className="mt-auto p-4">
              <div className="flex items-center gap-3 mb-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${profile?.name}`} alt={profile?.name} />
                  <AvatarFallback>{profile?.name?.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{profile?.name}</span>
                  <span className="text-xs text-muted-foreground">{profile?.unique_id || ''}</span>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full flex items-center justify-center gap-2"
                onClick={handleSignOut}
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            </div>
          </SidebarContent>
        </Sidebar>

        <div className="flex-1 overflow-auto">
          <div className="sticky top-0 z-10 bg-background p-4 border-b flex items-center justify-between">
            <SidebarTrigger />
            <span className="text-sm font-medium">
              {isAdmin ? "Admin Dashboard" : "Student Dashboard"}
            </span>
          </div>
          <div className="p-4 sm:p-6 lg:p-8">{children}</div>
        </div>
      </div>
    </SidebarProvider>
  );
}
