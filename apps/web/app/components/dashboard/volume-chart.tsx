'use client';

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { TrendingUp } from 'lucide-react';
import { formatBRL } from '@/lib/money';

export interface VolumePoint {
  date: string;
  label: string;
  total: number;
}

const chartConfig = {
  total: { label: 'Volume aprovado', color: 'var(--primary)' },
} satisfies ChartConfig;

function formatCompactBRL(value: number): string {
  if (value >= 1_000_000)
    return `R$ ${(value / 1_000_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}M`;
  if (value >= 1_000)
    return `R$ ${(value / 1_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}k`;
  return `R$ ${value.toLocaleString('pt-BR')}`;
}

/**
 * Single-series approved-payment volume trend. Code-split from the dashboard
 * index so recharts (and its d3/redux deps) load in a separate, lazy chunk
 * only when this card is actually rendered.
 */
export function VolumeTrendChart({ data }: { data: VolumePoint[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Volume de transações</CardTitle>
        <p className="text-xs text-muted-foreground">
          Valor aprovado por dia, a partir das suas transações reais
        </p>
      </CardHeader>
      <CardContent className="p-4">
        {data.length === 0 ? (
          <Empty className="py-10">
            <EmptyMedia variant="icon">
              <TrendingUp />
            </EmptyMedia>
            <EmptyContent>
              <EmptyTitle>Sem volume aprovado ainda</EmptyTitle>
              <EmptyDescription>
                Assim que pagamentos aprovados forem registrados, o gráfico de volume por dia
                aparecerá aqui.
              </EmptyDescription>
            </EmptyContent>
          </Empty>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="h-56 w-full"
            initialDimension={{ width: 600, height: 224 }}
          >
            <AreaChart data={data} margin={{ left: 4, right: 12, top: 4, bottom: 0 }}>
              <defs>
                <linearGradient id="fillVolume" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-total)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--color-total)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={28}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={56}
                tickFormatter={(value) => formatCompactBRL(Number(value))}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    indicator="line"
                    labelKey="label"
                    formatter={(value) => formatBRL(Number(value))}
                  />
                }
              />
              <Area
                dataKey="total"
                type="natural"
                stroke="var(--color-total)"
                strokeWidth={2}
                fill="url(#fillVolume)"
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
