
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Clock, AlertCircle, CheckCircle } from "lucide-react";

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
            Subscription Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No active subscriptions</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Subscription Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {subscriptions.map((subscription) => {
          const usedSessions = subscription.total_sessions - subscription.remaining_sessions;
          const progressPercentage = subscription.total_sessions > 0 
            ? (usedSessions / subscription.total_sessions) * 100 
            : 0;
          
          const isLowSessions = subscription.remaining_sessions <= 2 && subscription.remaining_sessions > 0;
          const isExpired = subscription.remaining_sessions === 0;

          return (
            <div key={subscription.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">{subscription.course_title}</h4>
                {subscription.warning && (
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
                {!isExpired && !isLowSessions && !subscription.warning && (
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
                    {subscription.remaining_sessions}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Total Sessions:</span>
                  <p className="font-semibold">{subscription.total_sessions}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{usedSessions} / {subscription.total_sessions} used</span>
                </div>
                <Progress 
                  value={progressPercentage} 
                  className="h-2"
                />
              </div>

              <div className="text-xs text-muted-foreground">
                Plan Duration: {subscription.plan_duration_months} month{subscription.plan_duration_months !== 1 ? 's' : ''}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
