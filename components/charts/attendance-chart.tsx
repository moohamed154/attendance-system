'use client';

import { memo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export const AttendanceChart = memo(function AttendanceChart({ data, dict }: { data: any[], dict: any }) {
  const chartDict = dict?.reportsPage?.attendanceChart || {};
  return (
    <Card className="rounded-2xl shadow-sm border-border/50">
      <CardHeader>
        <CardTitle>{chartDict.title || "Attendance Record"}</CardTitle>
        <CardDescription>{chartDict.subtitle || "Attendance statistics for the selected period"}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888833" />
              <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip 
                cursor={{fill: 'transparent'}}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Bar dataKey="PRESENT" stackId="a" fill="#22c55e" radius={[0, 0, 4, 4]} name={chartDict.present || "Present"} />
              <Bar dataKey="LATE" stackId="a" fill="#eab308" name={chartDict.late || "Late"} />
              <Bar dataKey="ABSENT" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} name={chartDict.absent || "Absent"} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
});
