import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { CreditCard, RefreshCw } from 'lucide-react';
import { PageHeader } from '@/components/dashboard/page-header';
import { EmptyState } from '@/components/dashboard/empty-state';
import { feesQueryOptions } from '../../lib/queries';
import { useDashboardQuery } from '../../lib/query/options';
import type { FeeDto } from '../../lib/api/types';
import type { Route } from './+types/fees';

export function meta(_: Route.MetaArgs) {
  return [
    { title: 'Tarifas de Cartão | LeraPay' },
    { name: 'description', content: 'Tabela completa de taxas de cartão do gateway Lera Box' },
  ];
}

const brandLabels: Record<string, string> = {
  VISA: 'Visa',
  MASTERCARD: 'Mastercard',
  ELO: 'Elo',
};

function normalizeFees(data: unknown): FeeDto[] {
  if (Array.isArray(data)) return data as FeeDto[];

  const nestedFees = (data as { fees?: unknown } | null)?.fees;
  return Array.isArray(nestedFees) ? (nestedFees as FeeDto[]) : [];
}

export default function FeesPage(_props: Route.ComponentProps) {
  const { data, refetch, isRefetching } = useDashboardQuery(feesQueryOptions());
  const fees = normalizeFees(data);

  const groupedFees = fees.reduce<Record<string, FeeDto[]>>((groups, fee) => {
    const brand = fee.brand.toUpperCase();
    const group = groups[brand] ?? [];
    group.push(fee);
    groups[brand] = group;
    return groups;
  }, {});

  const brands = Object.keys(groupedFees).sort((a, b) => {
    const order = ['VISA', 'MASTERCARD', 'ELO'];
    const aIndex = order.indexOf(a);
    const bIndex = order.indexOf(b);
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    return a.localeCompare(b);
  });

  for (const brand of brands) {
    groupedFees[brand].sort((a, b) => Number(a.installments) - Number(b.installments));
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Tarifas de cartão"
        description="Consulte as taxas oficiais do gateway Lera Box por bandeira e número de parcelas."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="gap-2"
          >
            <RefreshCw className={`size-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </Button>
        }
      />

      {brands.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <EmptyState
              icon={CreditCard}
              title="Nenhuma tarifa disponível"
              description="O gateway ainda não retornou faixas de parcelamento para sua conta. Tente atualizar novamente em alguns instantes."
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          {brands.map((brand) => {
            const brandFees = groupedFees[brand];
            const label = brandLabels[brand] || brand;

            return (
              <Card key={brand}>
                <CardHeader className="border-b">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <span className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                          <CreditCard className="size-4" />
                        </span>
                        {label}
                      </CardTitle>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {brandFees.length} faixas de parcelamento
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs uppercase">
                      {brand}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="max-h-[29rem] overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Parcelas</TableHead>
                          <TableHead className="text-right">Taxa</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {brandFees.map((fee) => (
                          <TableRow key={`${brand}-${fee.installments}`}>
                            <TableCell className="text-sm font-medium">
                              {fee.installments}x
                              {Number(fee.installments) === 1 && (
                                <span className="ml-2 text-xs font-normal text-muted-foreground">
                                  à vista
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                              {Number(fee.feePercent).toFixed(2)}%
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
