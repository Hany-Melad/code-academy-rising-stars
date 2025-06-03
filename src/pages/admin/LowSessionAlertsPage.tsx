
import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { AlertTriangle, RefreshCw, Phone, Mail } from "lucide-react";
import { LowSessionAlert } from "@/types/supabase";

const LowSessionAlertsPage = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [alerts, setAlerts] = useState<LowSessionAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAlerts = async () => {
    if (!profile) return;
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('low_session_alerts')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;

      setAlerts(data || []);
    } catch (error) {
      console.error('Error fetching low session alerts:', error);
      toast({
        title: "Error",
        description: "Failed to load low session alerts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshAlerts = async () => {
    try {
      setRefreshing(true);
      
      // Call the function to update alerts
      const { error } = await supabase.rpc('update_low_session_alerts');
      
      if (error) throw error;
      
      // Refresh the data
      await fetchAlerts();
      
      toast({
        title: "Success",
        description: "Low session alerts updated successfully",
      });
    } catch (error) {
      console.error('Error refreshing alerts:', error);
      toast({
        title: "Error",
        description: "Failed to refresh alerts",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [profile]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[80vh]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-t-academy-blue border-r-transparent border-b-academy-orange border-l-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-lg text-gray-600">Loading alerts...</p>
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
            <h1 className="text-3xl font-bold mb-1 flex items-center gap-2">
              <AlertTriangle className="h-8 w-8 text-orange-500" />
              Low Session Alerts
            </h1>
            <p className="text-muted-foreground">Students with only 1 remaining session</p>
          </div>
          <Button 
            onClick={refreshAlerts}
            disabled={refreshing}
            className="bg-academy-blue hover:bg-blue-600"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh Alerts'}
          </Button>
        </div>

        {alerts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {alerts.map((alert) => (
              <Card key={alert.id} className="border-orange-200 bg-orange-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span>{alert.student_name}</span>
                    <Badge variant="destructive" className="bg-orange-100 text-orange-800 border-orange-300">
                      {alert.remaining_sessions} session left
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <strong>Student ID:</strong>
                      <span className="text-muted-foreground">
                        {alert.student_unique_id || 'Not assigned'}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4" />
                      <span className="text-muted-foreground truncate">
                        {alert.student_email}
                      </span>
                    </div>
                    
                    {alert.student_phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4" />
                        <span className="text-muted-foreground">
                          {alert.student_phone}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="text-xs text-muted-foreground pt-2 border-t">
                    Last updated: {new Date(alert.updated_at).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-green-50 border-green-200">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertTriangle className="w-16 h-16 text-green-500 mb-4" />
              <h3 className="font-medium text-green-900 mb-2">No Low Session Alerts</h3>
              <p className="text-green-700 text-center">
                All students currently have sufficient sessions remaining.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default LowSessionAlertsPage;
