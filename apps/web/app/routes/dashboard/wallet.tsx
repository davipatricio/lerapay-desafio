import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Field, FieldLabel, FieldContent } from '@/components/ui/field';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { PageHeader } from '@/components/dashboard/page-header';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { TransactionTypeBadge } from '@/components/dashboard/transaction-type-badge';
import { EmptyState } from '@/components/dashboard/empty-state';
import { SummaryStrip } from '@/components/dashboard/summary-strip';
import { formatDateTime, formatReference } from '@/lib/dashboard';
import {
  Wallet,
  TrendingUp,
  ArrowDownToLine,
  RefreshCw,
  Receipt,
  SlidersHorizontal,
} from 'lucide-react';
import { walletBalanceQueryOptions, walletTransactionsQueryOptions } from '../../lib/queries';
import { useDashboardQuery } from '../../lib/query/options';
import { formatBRL } from '../../lib/money';
import type { TransactionDto } from '../../lib/api/types';
import type { Route } from './+types/wallet';

export function meta(_: Route.MetaArgs) {
  return [
    { title: 'Carteira & Saldo | LeraPay' },
    { name: 'description', content: 'Saldo em tempo real e extrato consolidado' },
  ];
}

const statusItems = [
  { value: 'ALL', label: 'Todos os status' },
  { value: 'APPROVED', label: 'Aprovados' },
  { value: 'PENDING', label: 'Pendentes' },
  { value: 'DENIED', label: 'Negados' },
  { value: 'EXPIRED', label: 'Expirados' },
  { value: 'CANCELLED', label: 'Cancelados' },
];

const typeItems = [
  { value: 'ALL', label: 'Todos os tipos' },
  { value: 'PIX', label: 'Pix' },
  { value: 'CREDIT_CARD', label: 'Cartão de Crédito' },
  { value: 'WITHDRAWAL', label: 'Saque Pix' },
];

export default function WalletPage(_props: Route.ComponentProps) {
  const {
    data: wallet,
    refetch: refetchWallet,
    isRefetching,
  } = useDashboardQuery(walletBalanceQueryOptions());

  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  const { data: transactionsData, refetch: refetchTx } = useDashboardQuery(
    walletTransactionsQueryOptions({
      status: statusFilter !== 'ALL' ? statusFilter : undefined,
    }),
  );

  const transactions: TransactionDto[] = Array.isArray(transactionsData)
    ? transactionsData
    : (transactionsData as any)?.transactions &&
        Array.isArray((transactionsData as any).transactions)
      ? (transactionsData as any).transactions
      : [];

  const handleRefresh = () => {
    refetchWallet();
    refetchTx();
  };

  const filteredTransactions: TransactionDto[] = transactions.filter((t: TransactionDto) => {
    if (typeFilter !== 'ALL' && t.type !== typeFilter) return false;
    return true;
  });
  const hasFilters = statusFilter !== 'ALL' || typeFilter !== 'ALL';
  const clearFilters = () => {
    setStatusFilter('ALL');
    setTypeFilter('ALL');
  };

  const totalInflow = transactions
    .filter((t: TransactionDto) => t.status === 'APPROVED' && t.type !== 'WITHDRAWAL')
    .reduce((sum: number, t: TransactionDto) => sum + (t.amount || 0), 0);

  const totalOutflow = transactions
    .filter(
      (t: TransactionDto) =>
        (t.status === 'APPROVED' || t.status === 'COMPLETED') && t.type === 'WITHDRAWAL',
    )
    .reduce((sum: number, t: TransactionDto) => sum + (t.amount || 0), 0);

  const totalFees = transactions
    .filter((t: TransactionDto) => t.status === 'APPROVED')
    .reduce((sum: number, t: TransactionDto) => sum + (t.fee || 0), 0);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <PageHeader
        title="Carteira & Extrato"
        description="Consulta de saldo ao vivo no gateway Lera Box e extrato financeiro detalhado"
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefetching}
            className="gap-2"
          >
            <RefreshCw className={`size-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
            <span>Atualizar Saldo</span>
          </Button>
        }
      />

      <SummaryStrip
        items={[
          {
            key: 'available-balance',
            label: 'Saldo disponível',
            value: formatBRL(wallet?.balance ?? 0),
            sub: 'Livre para saque imediato via Pix',
            icon: Wallet,
            featured: true,
          },
          {
            key: 'blocked-balance',
            label: 'Saldo bloqueado / reserva',
            value: formatBRL(wallet?.blockedBalance ?? 0),
            sub:
              totalOutflow > 0
                ? `${formatBRL(totalOutflow)} em saques realizados`
                : 'Retenções ou liquidações futuras',
            icon: ArrowDownToLine,
            tone: 'warning',
          },
          {
            key: 'inflow',
            label: 'Entradas aprovadas',
            value: formatBRL(totalInflow),
            sub: 'Vendas Pix e cartão',
            icon: TrendingUp,
            tone: 'success',
          },
          {
            key: 'fees',
            label: 'Taxas processadas',
            value: formatBRL(totalFees),
            sub: 'Tarifas de cartão retidas',
            icon: Receipt,
          },
        ]}
      />

      {/* Extrato Table */}
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base">Extrato de Movimentações</CardTitle>
            <CardDescription>
              Histórico de créditos e débitos sincronizados com o Lera Box Gateway
            </CardDescription>
          </div>

          <div className="grid w-full grid-cols-1 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-end">
            <Field className="w-full sm:w-44">
              <FieldLabel className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <SlidersHorizontal className="size-3.5" />
                Status
              </FieldLabel>
              <FieldContent>
                <Select
                  items={statusItems}
                  value={statusFilter}
                  onValueChange={(v) => setStatusFilter(String(v))}
                >
                  <SelectTrigger size="sm" className="w-full">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusItems.map((item) => (
                      <SelectItem key={item.value} value={item.value} label={item.label}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldContent>
            </Field>

            <Field className="w-full sm:w-44">
              <FieldLabel className="text-xs font-medium text-muted-foreground">Tipo</FieldLabel>
              <FieldContent>
                <Select
                  items={typeItems}
                  value={typeFilter}
                  onValueChange={(v) => setTypeFilter(String(v))}
                >
                  <SelectTrigger size="sm" className="w-full">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {typeItems.map((item) => (
                      <SelectItem key={item.value} value={item.value} label={item.label}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldContent>
            </Field>
            {hasFilters ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="justify-self-start"
              >
                Limpar filtros
              </Button>
            ) : null}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {filteredTransactions.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={Receipt}
                title={
                  hasFilters
                    ? 'Nenhum lançamento corresponde aos filtros'
                    : 'Nenhum lançamento registrado ainda'
                }
                description={
                  hasFilters
                    ? 'Ajuste ou limpe os filtros para consultar todas as movimentações.'
                    : 'Os créditos e débitos sincronizados aparecerão aqui.'
                }
                action={
                  hasFilters ? (
                    <Button variant="outline" size="sm" onClick={clearFilters}>
                      Limpar filtros
                    </Button>
                  ) : undefined
                }
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Referência</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right">Valor Bruto</TableHead>
                  <TableHead className="text-right">Taxa</TableHead>
                  <TableHead className="text-right">Valor Líquido</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((tx: TransactionDto) => {
                  const isWithdrawal = tx.type === 'WITHDRAWAL';

                  return (
                    <TableRow key={tx.id}>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDateTime(tx.createdAt)}
                      </TableCell>
                      <TableCell>
                        <TransactionTypeBadge type={tx.type} />
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {formatReference(tx.externalReference || tx.id)}
                      </TableCell>
                      <TableCell className="max-w-[180px] truncate text-xs">
                        {tx.description || 'Transação LeraPay'}
                      </TableCell>
                      <TableCell
                        className={`text-right font-medium tabular-nums ${
                          isWithdrawal ? 'text-warning' : 'text-foreground'
                        }`}
                      >
                        {isWithdrawal ? `- ${formatBRL(tx.amount)}` : `+ ${formatBRL(tx.amount)}`}
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {tx.fee ? formatBRL(tx.fee) : 'R$ 0,00'}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatBRL(tx.netAmount ?? tx.amount)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={tx.status} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
