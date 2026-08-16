'use client';

import * as React from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from 'recharts';

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { cn } from '@/lib/utils';

export type FinancialChartType = 'area' | 'line' | 'bar';

export interface FinancialChartSeries {
  /** Data key in each row. */
  key: string;
  /** Legend/tooltip label. */
  label: string;
  /** CSS color for the series (e.g. `var(--color-chart-1)`). */
  color: string;
}

export interface FinancialChartProps {
  data: Array<Record<string, string | number>>;
  /** Row key rendered on the X axis. */
  xKey: string;
  series: FinancialChartSeries[];
  type?: FinancialChartType;
  /** Optional money formatter for the Y axis + tooltip values. */
  valueFormatter?: (value: number) => string;
  className?: string;
}

const compactNumber = new Intl.NumberFormat('pt-BR', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

/** Compact money formatter for BRL axis ticks (e.g. `R$ 1,2 mi`). */
export function formatChartMoney(value: number): string {
  return `R$ ${compactNumber.format(value)}`;
}

/**
 * Thin wrapper over the shadcn ChartContainer that maps a `series` array to a
 * typed chart config and renders an area/line/bar chart with a styled tooltip.
 * Defaults to a money-formatted Y axis.
 */
export function FinancialChart({
  data,
  xKey,
  series,
  type = 'area',
  valueFormatter = formatChartMoney,
  className,
}: FinancialChartProps) {
  const config: ChartConfig = React.useMemo(
    () => Object.fromEntries(series.map((s) => [s.key, { label: s.label, color: s.color }])),
    [series],
  );

  return (
    <ChartContainer config={config} className={cn('aspect-auto h-56 w-full', className)}>
      <ChartCore
        data={data}
        xKey={xKey}
        series={series}
        type={type}
        valueFormatter={valueFormatter}
      />
    </ChartContainer>
  );
}

function ChartCore({
  data,
  xKey,
  series,
  type,
  valueFormatter,
}: {
  data: FinancialChartProps['data'];
  xKey: string;
  series: FinancialChartSeries[];
  type: FinancialChartType;
  valueFormatter: (value: number) => string;
}) {
  const yAxis = (
    <YAxis
      dataKey={series[0].key}
      width={52}
      tickLine={false}
      axisLine={false}
      fontSize={11}
      tick={{ fill: 'var(--color-muted-foreground)' }}
      tickFormatter={(v: number) => valueFormatter(v)}
    />
  );

  const seriesElements = series.map((s) => {
    const color = `var(--color-${s.key})`;
    const key = s.key;
    switch (type) {
      case 'bar':
        return <Bar key={key} dataKey={key} fill={color} radius={[3, 3, 0, 0]} maxBarSize={28} />;
      case 'line':
        return (
          <Line
            key={key}
            dataKey={key}
            type="monotone"
            stroke={color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        );
      case 'area':
      default:
        return (
          <Area
            key={key}
            dataKey={key}
            type="monotone"
            stroke={color}
            strokeWidth={2}
            fill={color}
            fillOpacity={0.14}
            dot={false}
            activeDot={{ r: 4 }}
          />
        );
    }
  });

  const margin = { top: 8, right: 8, bottom: 0, left: 0 };
  const inner = (
    <>
      <CartesianGrid vertical={false} stroke="var(--color-border)" strokeDasharray="3 3" />
      <XAxis
        dataKey={xKey}
        tickLine={false}
        axisLine={false}
        fontSize={11}
        stroke="var(--color-muted-foreground)"
        tick={{ fill: 'var(--color-muted-foreground)' }}
      />
      {yAxis}
      <ChartTooltip
        cursor={type === 'bar' ? false : { stroke: 'var(--color-border)' }}
        content={
          <ChartTooltipContent
            indicator={type === 'bar' ? 'dot' : 'line'}
            formatter={(value) => valueFormatter(Number(value))}
          />
        }
      />
      {seriesElements}
    </>
  );

  if (type === 'bar') {
    return (
      <BarChart data={data} margin={margin}>
        {inner}
      </BarChart>
    );
  }
  if (type === 'line') {
    return (
      <LineChart data={data} margin={margin}>
        {inner}
      </LineChart>
    );
  }
  return (
    <AreaChart data={data} margin={margin}>
      {inner}
    </AreaChart>
  );
}
