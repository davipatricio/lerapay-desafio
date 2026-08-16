import { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
} from 'lucide-react';
import { TransactionTypeBadge } from '@/components/dashboard/transaction-type-badge';
import { PageHeader, StatusBadge, SummaryStrip } from '@/components/dashboard';
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
  const [gatewayPending, setGatewayPending] = useState(false);

  useEffect(() => {
    const handlePending = () => setGatewayPending(true);
    const handleLinked = () => setGatewayPending(false);
    window.addEventListener('lerapay:gateway-pending', handlePending);
    window.addEventListener('lerapay:gateway-linked', handleLinked);
    return () => {
      window.removeEventListener('lerapay:gateway-pending', handlePending);
      window.removeEventListener('lerapay:gateway-linked', handleLinked);
    };
  }, []);

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

  const isGatewayTokenExpired =
    gatewayPending ||
    Boolean(
      meUser?.gatewayAccount?.isLinked &&
      meUser.gatewayAccount.tokenExpiresAt &&
      new Date(meUser.gatewayAccount.tokenExpiresAt) < new Date(),
    );
  const isGatewayLinked = Boolean(meUser?.gatewayAccount?.isLinked) && !isGatewayTokenExpired;

  return (
    <div className="flex flex-col gap-5">
      {/* Gateway link status banner */}
      {(!isGatewayLinked || isGatewayTokenExpired) && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-amber-600">
                <ShieldAlert className="size-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                  {isGatewayTokenExpired
                    ? 'A associação com o Gateway Lera Box está pendente'
                    : 'Sua conta ainda não está vinculada ao Gateway Lera Box'}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isGatewayTokenExpired
                    ? 'A sessão do gateway expirou ou foi rejeitada. Informe novamente a senha enviada pelo Lera Box para restabelecer o acesso.'
                    : `Verifique seu e-mail ${meUser?.email}: o processador enviou um link de ativação e a senha de acesso. Informe-os para liberar saldo, cobranças Pix, cartão e saques.`}
                </p>
              </div>
            </div>
            <Button
              size="sm"
              className="shrink-0 gap-2 bg-amber-600 hover:bg-amber-700"
              onClick={() => setLinkOpen(true)}
            >
              <ShieldCheck className="size-4" />
              <span>
                {isGatewayTokenExpired ? 'Reautenticar Gateway' : 'Vincular Gateway agora'}
              </span>
            </Button>
            {linkOpen ? (
              <Suspense fallback={null}>
                <LinkGatewayModal user={meUser} open onOpenChange={setLinkOpen} />
              </Suspense>
            ) : null}
          </CardContent>
        </Card>
      )}

      <PageHeader
        title="Dashboard"
        description="Visão consolidada da conta, transações e saldo no gateway Lera Box"
        actions={
          <>
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
          </>
        }
      />

      <SummaryStrip
        items={[
          {
            key: 'available-balance',
            label: 'Saldo disponível',
            value: formatBRL(wallet?.balance ?? 0),
            sub: `${formatBRL(wallet?.blockedBalance ?? 0)} bloqueado`,
            icon: Wallet,
            featured: true,
          },
          {
            key: 'approved-volume',
            label: 'Volume aprovado',
            value: formatBRL(approvedVolume),
            sub: `${approvedCount} transação(ões) aprovada(s)`,
            icon: TrendingUp,
            tone: 'success',
          },
          {
            key: 'transactions',
            label: 'Total de transações',
            value: String(transactions.length),
            sub: 'No extrato recente',
            icon: Receipt,
          },
          {
            key: 'pending',
            label: 'Em processamento',
            value: String(pendingCount),
            sub: 'Aguardando confirmação',
            icon: Clock,
            tone: 'warning',
          },
        ]}
      />

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
                      <TransactionTypeBadge type={tx.type} variant="badge" />
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
                      <StatusBadge status={link.status} />
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
                      <StatusBadge status={w.status} />
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
