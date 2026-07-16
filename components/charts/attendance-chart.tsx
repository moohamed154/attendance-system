'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export function AttendanceChart({ data, dict }: { data: any[], dict: any }) {
  return (
    <Card className="rounded-2xl shadow-sm border-border/50">
      <CardHeader>
        <CardTitle>{dict.reportsPage.attendanceChart.title}</CardTitle>
        <CardDescription>{dict.reportsPage.attendanceChart.subtitle}</CardDescription>
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
              <Bar dataKey="PRESENT" stackId="a" fill="#22c55e" radius={[0, 0, 4, 4]} name={dict.reportsPage.attendanceChart.present} />
              <Bar dataKey="LATE" stackId="a" fill="#eab308" name={dict.reportsPage.attendanceChart.late} />
              <Bar dataKey="ABSENT" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} name={dict.reportsPage.attendanceChart.absent} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
