
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Clock, AlertCircle, CheckCircle, Users } from "lucide-react";

interface SubscriptionData {
  id: string;
  remaining_sessions: number;
  total_sessions: number;
  plan_duration_months: number;
  warning: boolean;
  course_title: string;
}

interface SubscriptionCardProps {
  subscriptions: SubscriptionData[];
}

export function SubscriptionCard({ subscriptions }: SubscriptionCardProps) {
  if (subscriptions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Global Subscription Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No active subscriptions</p>
        </CardContent>
      </Card>
    );
  }

  // Since we now have global subscriptions, we'll show the first one as the main subscription
  // In the new system, there should typically be only one global subscription per student
  const globalSubscription = subscriptions[0];
  const correctTotalSessions = globalSubscription.plan_duration_months * 4;
  const usedSessions = correctTotalSessions - globalSubscription.remaining_sessions;
  
  // Progress should be based on remaining sessions vs total sessions
  const progressPercentage = correctTotalSessions > 0 
    ? ((correctTotalSessions - globalSubscription.remaining_sessions) / correctTotalSessions) * 100 
    : 0;
  
  const isLowSessions = globalSubscription.remaining_sessions <= 2 && globalSubscription.remaining_sessions > 0;
  const isExpired = globalSubscription.remaining_sessions === 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Global Subscription Status
          <Users className="h-4 w-4 ml-auto text-muted-foreground" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Global Session Plan</h4>
            {globalSubscription.warning && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Warning
              </Badge>
            )}
            {isExpired && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Expired
              </Badge>
            )}
            {isLowSessions && !isExpired && (
              <Badge variant="outline" className="flex items-center gap-1 border-orange-200 text-orange-700">
                <AlertCircle className="h-3 w-3" />
                Low Sessions
              </Badge>
            )}
            {!isExpired && !isLowSessions && !globalSubscription.warning && (
              <Badge variant="outline" className="flex items-center gap-1 border-green-200 text-green-700">
                <CheckCircle className="h-3 w-3" />
                Active
              </Badge>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Remaining Sessions:</span>
              <p className={`font-semibold ${isExpired ? 'text-red-600' : isLowSessions ? 'text-orange-600' : 'text-green-600'}`}>
                {globalSubscription.remaining_sessions}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Total Sessions:</span>
              <p className="font-semibold">{correctTotalSessions}</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{usedSessions} / {correctTotalSessions} used</span>
            </div>
            <Progress 
              value={progressPercentage} 
              className="h-2"
            />
          </div>

          <div className="text-xs text-muted-foreground">
            Plan Duration: {globalSubscription.plan_duration_months} month{globalSubscription.plan_duration_months !== 1 ? 's' : ''} • 
            Sessions are shared across all your groups
          </div>
        </div>

        {subscriptions.length > 1 && (
          <div className="text-xs text-muted-foreground bg-blue-50 p-2 rounded">
            Note: You have multiple subscription records. The system now uses a global subscription model where sessions are shared across all groups.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
