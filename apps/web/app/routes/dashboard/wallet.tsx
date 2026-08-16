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
import { EmptyState } from '@/components/dashboard/empty-state';
import { formatDateTime, formatReference } from '@/lib/dashboard';
import {
  Wallet,
  TrendingUp,
  ArrowDownToLine,
  RefreshCw,
  Receipt,
  SlidersHorizontal,
  CreditCard,
  QrCode,
  ArrowUpRight,
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
  { value: 'WITHDRAWAL', label: 'Saque' },
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

      {/* Balance Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-primary">
              <span className="text-xs font-semibold uppercase tracking-wider">
                Saldo Disponível
              </span>
              <Wallet className="size-4" />
            </div>
            <p className="mt-3 text-3xl font-bold tracking-tight text-primary">
              {formatBRL(wallet?.balance ?? 0)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Livre para saque imediato via Pix</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Saldo Bloqueado / Reserva</span>
              <ArrowDownToLine className="size-4" />
            </div>
            <p className="mt-3 text-2xl font-bold tracking-tight">
              {formatBRL(wallet?.blockedBalance ?? 0)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {totalOutflow > 0
                ? `${formatBRL(totalOutflow)} em saques realizados`
                : 'Retenções ou liquidações futuras'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
              <span className="text-xs font-medium">Entradas Aprovadas</span>
              <TrendingUp className="size-4" />
            </div>
            <p className="mt-3 text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
              {formatBRL(totalInflow)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Vendas Pix e Cartão</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Taxas Processadas</span>
              <Receipt className="size-4" />
            </div>
            <p className="mt-3 text-2xl font-bold tracking-tight">{formatBRL(totalFees)}</p>
            <p className="mt-1 text-xs text-muted-foreground">Tarifas de cartão retidas</p>
          </CardContent>
        </Card>
      </div>

      {/* Extrato Table */}
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base">Extrato de Movimentações</CardTitle>
            <CardDescription>
              Histórico de créditos e débitos sincronizados com o Lera Box Gateway
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-end gap-2">
            <Field className="w-44">
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

            <Field className="w-44">
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
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {filteredTransactions.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={Receipt}
                title="Nenhum lançamento encontrado"
                description="Ajuste os filtros ou aguarde novas movimentações na sua conta."
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
                        <div className="flex items-center gap-1.5">
                          {tx.type === 'PIX' && <QrCode className="size-3.5 text-emerald-500" />}
                          {tx.type === 'CREDIT_CARD' && (
                            <CreditCard className="size-3.5 text-sky-500" />
                          )}
                          {tx.type === 'WITHDRAWAL' && (
                            <ArrowUpRight className="size-3.5 text-amber-500" />
                          )}
                          <span className="text-xs font-medium">{tx.type}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {formatReference(tx.externalReference || tx.id)}
                      </TableCell>
                      <TableCell className="max-w-[180px] truncate text-xs">
                        {tx.description || 'Transação LeraPay'}
                      </TableCell>
                      <TableCell
                        className={`text-right font-medium ${
                          isWithdrawal ? 'text-amber-600' : 'text-foreground'
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
