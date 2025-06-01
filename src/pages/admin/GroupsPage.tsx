
import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Users, Calendar, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { CreateGroupDialog } from "@/components/admin/CreateGroupDialog";

interface CourseGroup {
  id: string;
  title: string;
  branch: string | null;
  start_date: string;
  created_at: string;
  created_by: string;
  allowed_admin_id: string | null;
  course: {
    id: string;
    title: string;
    description: string | null;
  };
  creator: {
    name: string;
  };
  _count: {
    students: number;
  };
}

const GroupsPage = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [groups, setGroups] = useState<CourseGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);

  const fetchGroups = async () => {
    if (!profile) return;
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('course_groups')
        .select(`
          *,
          course:courses(id, title, description),
          creator:profiles!course_groups_created_by_fkey(name)
        `)
        .or(`created_by.eq.${profile.id},allowed_admin_id.eq.${profile.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get student counts for each group
      const groupsWithCounts = await Promise.all(
        (data || []).map(async (group) => {
          const { count } = await supabase
            .from('course_group_students')
            .select('*', { count: 'exact', head: true })
            .eq('group_id', group.id);

          return {
            ...group,
            _count: { students: count || 0 }
          };
        })
      );

      setGroups(groupsWithCounts);
    } catch (error) {
      console.error('Error fetching groups:', error);
      toast({
        title: "Error",
        description: "Failed to load groups",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, [profile]);

  const handleGroupCreated = () => {
    fetchGroups();
    setOpenCreateDialog(false);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[80vh]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-t-academy-blue border-r-transparent border-b-academy-orange border-l-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-lg text-gray-600">Loading groups...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-1">Course Groups</h1>
            <p className="text-muted-foreground">Manage student groups and subscriptions</p>
          </div>
          <Button onClick={() => setOpenCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Group
          </Button>
        </div>

        {groups.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((group) => (
              <Card key={group.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <Link to={`/admin/groups/${group.id}`}>
                  <CardHeader>
                    <CardTitle className="text-lg">{group.title}</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Badge variant="outline">{group.course.title}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {group.branch && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4" />
                        <span>{group.branch}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4" />
                      <span>Started {new Date(group.start_date).toLocaleDateString()}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="w-4 h-4" />
                      <span>{group._count.students} students</span>
                    </div>
                    
                    <div className="text-xs text-muted-foreground">
                      Created by {group.creator.name}
                    </div>
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="font-medium text-gray-900 mb-2">No groups yet</h3>
            <p className="text-gray-600 mb-4">
              Create your first group to start managing student subscriptions.
            </p>
            <Button onClick={() => setOpenCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create First Group
            </Button>
          </div>
        )}
      </div>

      <CreateGroupDialog 
        open={openCreateDialog}
        onOpenChange={setOpenCreateDialog}
        onGroupCreated={handleGroupCreated}
      />
    </DashboardLayout>
  );
};

export default GroupsPage;
