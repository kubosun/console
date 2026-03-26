'use client';

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

interface DataPoint {
  time: number;
  value: number;
  label: string;
}

interface MetricsChartProps {
  data: DataPoint[];
  color?: string;
  unit?: string;
  height?: number;
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function MetricsChart({
  data,
  color = 'hsl(var(--primary))',
  unit = '',
  height = 200,
}: MetricsChartProps) {
  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-sm text-muted-foreground"
        style={{ height }}
      >
        No data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.2} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="time"
          tickFormatter={formatTime}
          className="text-xs"
          tick={{ fill: 'hsl(var(--muted-foreground))' }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          className="text-xs"
          tick={{ fill: 'hsl(var(--muted-foreground))' }}
          tickLine={false}
          axisLine={false}
          width={45}
        />
        <Tooltip
          labelFormatter={(label) => formatTime(Number(label))}
          formatter={(value) => [`${Number(value).toFixed(1)}${unit}`, '']}
          contentStyle={{
            backgroundColor: 'hsl(var(--popover))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '6px',
            fontSize: '12px',
          }}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          fill="url(#chartGradient)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
