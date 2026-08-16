import { Suspense, lazy, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Empty,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from '@/components/ui/empty';
import {
  Item,
  ItemGroup,
  ItemMedia,
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemActions,
} from '@/components/ui/item';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Wallet,
  TrendingUp,
  Receipt,
  Clock,
  Link2,
  ArrowUpRight,
  Plus,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';
import {
  checkoutLinksQueryOptions,
  useMeQuery,
  walletBalanceQueryOptions,
  walletTransactionsQueryOptions,
  withdrawalsListQueryOptions,
} from '../../lib/queries';
import { useDashboardQuery } from '../../lib/query/options';
import type { TransactionDto, CheckoutLinkDto, WithdrawalDto } from '../../lib/api/types';
import { formatBRL } from '../../lib/money';
import type { Route } from './+types/index';

export function meta(_: Route.MetaArgs) {
  return [
    { title: 'Dashboard | LeraPay' },
    { name: 'description', content: 'Visão geral da sua conta e operações' },
  ];
}

type TxStatus = 'APPROVED' | 'PENDING' | 'DENIED' | 'EXPIRED' | 'CANCELLED' | string;

const statusTone: Record<string, string> = {
  APPROVED: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  PENDING: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  DENIED: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
  EXPIRED: 'bg-muted text-muted-foreground border-border',
  CANCELLED: 'bg-muted text-muted-foreground border-border',
};

const statusLabel: Record<string, string> = {
  APPROVED: 'Aprovado',
  PENDING: 'Pendente',
  DENIED: 'Negado',
  EXPIRED: 'Expirado',
  CANCELLED: 'Cancelado',
};

function StatusBadge({ status }: { status: TxStatus }) {
  return (
    <Badge variant="outline" className={statusTone[status] || statusTone.CANCELLED}>
      {statusLabel[status] || status}
    </Badge>
  );
}

function formatDate(iso?: string): string {
  if (!iso) return '-';
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Normalize the raw wallet-transactions response into a stable array. */
function asTransactions(data: unknown): TransactionDto[] {
  if (Array.isArray(data)) return data as TransactionDto[];
  const nested = (data as any)?.transactions;
  return Array.isArray(nested) ? (nested as TransactionDto[]) : [];
}

function StatCard({
  title,
  value,
  sub,
  icon: Icon,
}: {
  title: string;
  value: string;
  sub: string;
  icon: LucideIcon;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-xs font-medium">{title}</span>
          <Icon className="size-4" />
        </div>
        <>
          <p className="mt-2 text-xl font-bold tracking-tight">{value}</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">{sub}</p>
        </>
      </CardContent>
    </Card>
  );
}

// The chart pulls in recharts (and its d3/redux deps); code-split it so the
// metrics + tables paint first and the chart chunk loads only when rendered.
const LinkGatewayModal = lazy(() =>
  import('../../components/link-gateway-modal').then((m) => ({ default: m.LinkGatewayModal })),
);

const VolumeTrendChart = lazy(() =>
  import('../../components/dashboard/volume-chart').then((m) => ({ default: m.VolumeTrendChart })),
);

function VolumeChartSkeleton() {
  return (
    <Card>
      <CardHeader className="grid gap-1">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-56" />
      </CardHeader>
      <CardContent className="p-4">
        <Skeleton className="h-56 w-full" />
      </CardContent>
    </Card>
  );
}

export default function Dashboard(_props: Route.ComponentProps) {
  const { data: meUser } = useMeQuery();
  const [linkOpen, setLinkOpen] = useState(false);

  const {
    data: wallet,
    refetch: refetchWallet,
    isRefetching: isWalletRefetching,
  } = useDashboardQuery(walletBalanceQueryOptions());

  const { data: transactionsData, refetch: refetchTransactions } = useDashboardQuery(
    walletTransactionsQueryOptions({ limit: 10 }),
  );
  const transactions: TransactionDto[] = asTransactions(transactionsData);

  // Broader fetch to power the real transaction-volume trend (no invented data).
  const { data: trendData } = useDashboardQuery(walletTransactionsQueryOptions({ limit: 100 }));
  const trendTransactions: TransactionDto[] = asTransactions(trendData);

  const { data: checkoutLinksData } = useDashboardQuery(checkoutLinksQueryOptions());
  const checkoutLinks: CheckoutLinkDto[] = Array.isArray(checkoutLinksData)
    ? (checkoutLinksData as CheckoutLinkDto[])
    : [];

  const { data: withdrawalsData } = useDashboardQuery(withdrawalsListQueryOptions());
  const withdrawals: WithdrawalDto[] = Array.isArray(withdrawalsData)
    ? (withdrawalsData as WithdrawalDto[])
    : [];

  const approvedVolume = transactions
    .filter((t) => t.status === 'APPROVED')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const pendingCount = transactions.filter((t) => t.status === 'PENDING').length;
  const approvedCount = transactions.filter((t) => t.status === 'APPROVED').length;

  // Aggregate approved amounts by calendar day, chronologically ordered.
  const volumeTrend = useMemo(() => {
    const byDay = new Map<string, number>();
    for (const t of trendTransactions) {
      if (t.status !== 'APPROVED' || !t.createdAt) continue;
      const day = t.createdAt.slice(0, 10);
      byDay.set(day, (byDay.get(day) || 0) + (t.amount || 0));
    }
    return Array.from(byDay.entries())
      .map(([date, total]) => ({
        date,
        label: new Date(`${date}T00:00:00`).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
        }),
        total,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [trendTransactions]);

  const handleRefreshAll = () => {
    refetchWallet();
    refetchTransactions();
  };

  const isGatewayLinked = Boolean(meUser?.gatewayAccount?.isLinked);

  return (
    <div className="flex flex-col gap-5">
      {/* Gateway link status banner */}
      {!isGatewayLinked && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-amber-600">
                <ShieldAlert className="size-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                  Sua conta ainda não está vinculada ao Gateway Lera Box
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Verifique seu e-mail <strong>{meUser?.email}</strong>: o processador enviou um
                  link de ativação e a senha de acesso. Informe-os para liberar saldo, cobranças
                  Pix, cartão e saques.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              className="shrink-0 gap-2 bg-amber-600 hover:bg-amber-700"
              onClick={() => setLinkOpen(true)}
            >
              <ShieldCheck className="size-4" />
              <span>Vincular Gateway agora</span>
            </Button>
            {linkOpen ? (
              <Suspense fallback={null}>
                <LinkGatewayModal user={meUser} open onOpenChange={setLinkOpen} />
              </Suspense>
            ) : null}
          </CardContent>
        </Card>
      )}

      {/* Page header with quick actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-sm text-muted-foreground">
            Visão consolidada da conta, transações e saldo no gateway Lera Box
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshAll}
            disabled={isWalletRefetching}
            className="gap-2"
          >
            <RefreshCw className={`size-3.5 ${isWalletRefetching ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </Button>
          <Button size="sm" render={<Link to="/dashboard/checkout" />} className="gap-2">
            <Plus className="size-3.5" />
            <span>Novo Link</span>
          </Button>
        </div>
      </div>

      {/* Operational summary strip */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Saldo disponível"
          value={formatBRL(wallet?.balance ?? 0)}
          sub={`${formatBRL(wallet?.blockedBalance ?? 0)} bloqueado`}
          icon={Wallet}
        />
        <StatCard
          title="Volume aprovado"
          value={formatBRL(approvedVolume)}
          sub={`${approvedCount} transação(ões) aprovada(s)`}
          icon={TrendingUp}
        />
        <StatCard
          title="Total de transações"
          value={String(transactions.length)}
          sub="No extrato recente"
          icon={Receipt}
        />
        <StatCard
          title="Em processamento"
          value={String(pendingCount)}
          sub="Aguardando confirmação"
          icon={Clock}
        />
      </div>

      {/* Transaction-volume trend (real data) — lazy chunk, skeleton while it loads */}
      <Suspense fallback={<VolumeChartSkeleton />}>
        <VolumeTrendChart data={volumeTrend} />
      </Suspense>

      {/* Transactions table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Transações recentes</CardTitle>
            <p className="text-xs text-muted-foreground">Últimas movimentações registradas</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            render={<Link to="/dashboard/transactions" />}
            className="text-xs"
          >
            Ver todas
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {transactions.length === 0 ? (
            <Empty className="py-10">
              <EmptyMedia variant="icon">
                <Receipt />
              </EmptyMedia>
              <EmptyContent>
                <EmptyTitle>Nenhuma transação registrada ainda</EmptyTitle>
                <EmptyDescription>
                  Crie um link de checkout para começar a receber pagamentos Pix e Cartão.
                </EmptyDescription>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  render={<Link to="/dashboard/checkout" />}
                >
                  Criar primeiro link
                </Button>
              </EmptyContent>
            </Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Referência</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="hidden sm:table-cell">Data</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.slice(0, 6).map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="font-mono text-xs">
                      {tx.externalReference || tx.id.slice(0, 12)}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {tx.description || 'Transação BaaS'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-[10px]">
                        {tx.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden text-xs text-muted-foreground sm:table-cell">
                      {formatDate(tx.createdAt)}
                    </TableCell>
                    <TableCell className="text-right font-medium">{formatBRL(tx.amount)}</TableCell>
                    <TableCell>
                      <StatusBadge status={tx.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Checkout links + withdrawals preview */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Links de checkout</CardTitle>
              <p className="text-xs text-muted-foreground">Links rápidos de cobrança</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              render={<Link to="/dashboard/checkout" />}
              className="text-xs"
            >
              Gerenciar
            </Button>
          </CardHeader>
          <CardContent className="p-3">
            {checkoutLinks.length === 0 ? (
              <div className="p-4 text-center text-xs text-muted-foreground">
                Nenhum link de checkout criado.
              </div>
            ) : (
              <ItemGroup>
                {checkoutLinks.slice(0, 3).map((link) => (
                  <Item key={link.id} variant="outline" size="sm">
                    <ItemMedia>
                      <Link2 className="size-4 text-muted-foreground" />
                    </ItemMedia>
                    <ItemContent>
                      <ItemTitle>{link.title}</ItemTitle>
                      <ItemDescription className="font-mono">
                        {link.externalReference} · {formatBRL(link.amount)}
                      </ItemDescription>
                    </ItemContent>
                    <ItemActions>
                      <Badge
                        variant="outline"
                        className={
                          link.status === 'ACTIVE'
                            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                            : 'bg-muted text-muted-foreground border-border'
                        }
                      >
                        {link.status === 'ACTIVE' ? 'Ativo' : 'Concluído'}
                      </Badge>
                    </ItemActions>
                  </Item>
                ))}
              </ItemGroup>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Saques recentes</CardTitle>
              <p className="text-xs text-muted-foreground">Transferências Pix para sua conta</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              render={<Link to="/dashboard/withdrawals" />}
              className="text-xs"
            >
              Solicitar
            </Button>
          </CardHeader>
          <CardContent className="p-3">
            {withdrawals.length === 0 ? (
              <div className="p-4 text-center text-xs text-muted-foreground">
                Nenhum saque solicitado recentemente.
              </div>
            ) : (
              <ItemGroup>
                {withdrawals.slice(0, 3).map((w) => (
                  <Item key={w.id} variant="outline" size="sm">
                    <ItemMedia>
                      <ArrowUpRight className="size-4 text-muted-foreground" />
                    </ItemMedia>
                    <ItemContent>
                      <ItemTitle>{formatBRL(w.amount)}</ItemTitle>
                      <ItemDescription className="font-mono">{w.pixKey}</ItemDescription>
                    </ItemContent>
                    <ItemActions>
                      <Badge
                        variant="outline"
                        className={
                          w.status === 'APPROVED' || w.status === 'COMPLETED'
                            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                        }
                      >
                        {w.status === 'APPROVED' || w.status === 'COMPLETED'
                          ? 'Concluído'
                          : 'Processando'}
                      </Badge>
                    </ItemActions>
                  </Item>
                ))}
              </ItemGroup>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
