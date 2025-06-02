
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, Clock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  id: string;
  title: string;
  message: string;
  notification_type: string;
  created_at: string;
  read_at: string | null;
}

export function NotificationsCard() {
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      fetchNotifications();
    }
  }, [profile]);

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('student_notifications')
        .select('*')
        .eq('student_id', profile!.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await supabase
        .from('student_notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId);

      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, read_at: new Date().toISOString() }
            : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Recent Notifications
          {notifications.filter(n => !n.read_at).length > 0 && (
            <Badge variant="destructive" className="ml-auto">
              {notifications.filter(n => !n.read_at).length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {notifications.length === 0 ? (
          <p className="text-sm text-muted-foreground">No notifications yet</p>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                !notification.read_at 
                  ? 'bg-blue-50 border-blue-200 hover:bg-blue-100' 
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => !notification.read_at && markAsRead(notification.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{notification.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {notification.message}
                  </p>
                  <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                  </div>
                </div>
                {!notification.read_at && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-1"></div>
                )}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
