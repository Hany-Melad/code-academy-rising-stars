
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, Clock, Users, Plus, Minus, ChevronDown, ChevronUp } from "lucide-react";
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
  group_name?: string;
}

export function NotificationsCard() {
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

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
        .limit(20);

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
      const { error } = await supabase
        .from('student_notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) throw error;

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

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter(n => !n.read_at).map(n => n.id);
      if (unreadIds.length === 0) return;

      const { error } = await supabase
        .from('student_notifications')
        .update({ read_at: new Date().toISOString() })
        .in('id', unreadIds);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(notif => ({ ...notif, read_at: new Date().toISOString() }))
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'session_update':
        return type.includes('add') ? <Plus className="h-3 w-3" /> : <Minus className="h-3 w-3" />;
      case 'group_added':
        return <Users className="h-3 w-3" />;
      default:
        return <Bell className="h-3 w-3" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.read_at).length;
  const displayedNotifications = expanded ? notifications : notifications.slice(0, 3);

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
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="h-4 w-4" />
            Recent Notifications
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs px-1.5 py-0.5">
                {unreadCount}
              </Badge>
            )}
          </CardTitle>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={markAllAsRead}
              className="text-xs h-6 px-2"
            >
              Mark all read
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {notifications.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No notifications yet</p>
        ) : (
          <>
            {displayedNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`border rounded-md p-2 cursor-pointer transition-all hover:shadow-sm ${
                  !notification.read_at 
                    ? 'bg-blue-50 border-blue-200 hover:bg-blue-100' 
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => !notification.read_at && markAsRead(notification.id)}
              >
                <div className="flex items-start gap-2">
                  <div className={`mt-0.5 ${!notification.read_at ? 'text-blue-500' : 'text-gray-400'}`}>
                    {getNotificationIcon(notification.notification_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <h4 className="font-medium text-xs leading-tight">{notification.title}</h4>
                      {!notification.read_at && (
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1 flex-shrink-0"></div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-tight">
                      {notification.message}
                    </p>
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                      <Clock className="h-2.5 w-2.5" />
                      {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {notifications.length > 3 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpanded(!expanded)}
                className="w-full h-6 text-xs"
              >
                {expanded ? (
                  <>
                    <ChevronUp className="h-3 w-3 mr-1" />
                    Show less
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3 mr-1" />
                    Show {notifications.length - 3} more
                  </>
                )}
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
