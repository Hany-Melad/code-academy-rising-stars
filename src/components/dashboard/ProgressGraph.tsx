
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

interface ProgressData {
  name: string;
  completed: number;
  total: number;
}

interface ProgressGraphProps {
  data: ProgressData[];
  className?: string;
}

export function ProgressGraph({ data, className }: ProgressGraphProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-xl">Your Progress</CardTitle>
      </CardHeader>
      <CardContent className="h-[300px]">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis 
                dataKey="name"
                tick={{ fontSize: 12 }}
                axisLine={{ stroke: "#E5E7EB" }}
                tickLine={false}
              />
              <YAxis 
                axisLine={{ stroke: "#E5E7EB" }}
                tickLine={false}
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{ 
                  backgroundColor: "white",
                  border: "1px solid #E5E7EB",
                  borderRadius: "0.5rem",
                  boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)",
                }}
              />
              <Bar dataKey="completed" name="Completed" fill="#0EA5E9" radius={[4, 4, 0, 0]} />
              <Bar dataKey="total" name="Total" fill="#F97316" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            No progress data available
          </div>
        )}
      </CardContent>
    </Card>
  );
}
