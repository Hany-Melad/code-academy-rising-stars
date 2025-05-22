
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  colorVariant?: "blue" | "orange" | "green" | "purple" | "default";
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  colorVariant = "default",
}: StatsCardProps) {
  const cardColors = {
    blue: "bg-academy-lightBlue border-academy-blue",
    orange: "bg-academy-lightOrange border-academy-orange",
    green: "bg-green-50 border-green-500",
    purple: "bg-purple-50 border-purple-500",
    default: "bg-white border-gray-200",
  };

  const iconColors = {
    blue: "bg-academy-blue text-white",
    orange: "bg-academy-orange text-white",
    green: "bg-green-500 text-white",
    purple: "bg-purple-500 text-white",
    default: "bg-gray-100 text-gray-600",
  };

  return (
    <Card className={cn("border", cardColors[colorVariant])}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={cn("p-2 rounded-full", iconColors[colorVariant])}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
        
        {trend && (
          <div className="flex items-center mt-2">
            <span
              className={cn("text-xs font-medium", {
                "text-green-500": trend.isPositive,
                "text-red-500": !trend.isPositive,
              })}
            >
              {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
            </span>
            <span className="text-xs text-muted-foreground ml-1">from last week</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
