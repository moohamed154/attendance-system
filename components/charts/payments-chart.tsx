'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export function PaymentsChart({ data, dict, currency }: { data: any[], dict: any, currency?: string }) {
  const currencySymbol = currency || dict.reportsPage.export.egp;
  // Translate month names in data based on dictionary
  const localizedData = data.map(item => {
    // Find the month number (1-12) by checking english abbreviation or just passing it
    const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthIndex = MONTHS_EN.indexOf(item.month) + 1;
    const localizedMonth = monthIndex > 0 ? dict.paymentsPage.months[monthIndex.toString()] : item.month;
    return { ...item, monthLocalized: localizedMonth };
  });

  return (
    <Card className="rounded-2xl shadow-sm border-border/50">
      <CardHeader>
        <CardTitle>{dict.reportsPage.paymentsChart.title}</CardTitle>
        <CardDescription>{dict.reportsPage.paymentsChart.subtitle}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={localizedData}
              margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888833" />
              <XAxis dataKey="monthLocalized" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip 
                cursor={{fill: 'transparent'}}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                formatter={(value) => [`${Number(value ?? 0)} ${currencySymbol}`]}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Bar dataKey="PAID" stackId="a" fill="#22c55e" radius={[0, 0, 4, 4]} name={dict.reportsPage.paymentsChart.collected} />
              <Bar dataKey="UNPAID" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} name={dict.reportsPage.paymentsChart.pending} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
