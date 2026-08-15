'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DataPoint {
  label: string;
  revenue: number;
  orders: number;
}

interface Props {
  data: DataPoint[];
}

function formatAFN(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M AFN`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K AFN`;
  return `${value} AFN`;
}

export function SellerSalesChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.5} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={formatAFN}
          tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
          axisLine={false}
          tickLine={false}
          width={60}
        />
        <Tooltip
          formatter={(value: number) => [formatAFN(value), 'درآمد']}
          labelFormatter={(label) => `ماه: ${label}`}
          contentStyle={{
            borderRadius: '8px',
            border: '1px solid var(--border)',
            background: 'var(--background)',
            color: 'var(--foreground)',
            fontSize: 12,
          }}
        />
        <Bar
          dataKey="revenue"
          fill="#e11d48"
          radius={[4, 4, 0, 0]}
          maxBarSize={48}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
