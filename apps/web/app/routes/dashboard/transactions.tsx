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
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
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
import { formatDateTime, formatReference } from '@/lib/dashboard';
import { Receipt, Search, RefreshCw, SlidersHorizontal } from 'lucide-react';
import { walletTransactionsQueryOptions } from '../../lib/queries';
import { useDashboardQuery } from '../../lib/query/options';
import { formatBRL } from '../../lib/money';
import type { TransactionDto } from '../../lib/api/types';
import type { Route } from './+types/transactions';

export function meta(_: Route.MetaArgs) {
  return [
    { title: 'Transações | LeraPay' },
    { name: 'description', content: 'Histórico completo e filtros de transações' },
  ];
}

const statusItems = [
  { value: 'ALL', label: 'Todos os status' },
  { value: 'APPROVED', label: 'Aprovadas' },
  { value: 'PENDING', label: 'Pendentes' },
  { value: 'DENIED', label: 'Negadas' },
  { value: 'EXPIRED', label: 'Expiradas' },
  { value: 'CANCELLED', label: 'Canceladas' },
];

const typeItems = [
  { value: 'ALL', label: 'Todos os tipos' },
  { value: 'PIX', label: 'Pix' },
  { value: 'CREDIT_CARD', label: 'Cartão de Crédito' },
  { value: 'WITHDRAWAL', label: 'Saque Pix' },
];

export default function TransactionsPage(_props: Route.ComponentProps) {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  const {
    data: transactionsData,
    refetch,
    isRefetching,
  } = useDashboardQuery(
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

  const filtered = transactions.filter((t: TransactionDto) => {
    if (typeFilter !== 'ALL' && t.type !== typeFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const ref = (t.externalReference || '').toLowerCase();
      const desc = (t.description || '').toLowerCase();
      const id = (t.id || '').toLowerCase();
      return ref.includes(q) || desc.includes(q) || id.includes(q);
    }
    return true;
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <PageHeader
        title="Transações"
        description="Acompanhe todas as entradas e saídas com conciliação por referência externa"
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

      {/* Filter and Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <Field className="flex-1">
              <FieldLabel className="text-xs font-medium text-muted-foreground">
                Buscar transação
              </FieldLabel>
              <FieldContent>
                <InputGroup>
                  <InputGroupAddon align="inline-start">
                    <Search className="size-4" />
                  </InputGroupAddon>
                  <InputGroupInput
                    placeholder="Referência externa, descrição ou ID..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </InputGroup>
              </FieldContent>
            </Field>

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
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Listagem Geral</CardTitle>
          <CardDescription>{filtered.length} transação(ões) encontrada(s)</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={Receipt}
                title="Nenhuma transação encontrada"
                description="Tente redefinir os filtros ou os termos de busca."
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data / Hora</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Referência</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-right">Taxa</TableHead>
                  <TableHead className="text-right">Líquido</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((tx) => (
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
                    <TableCell className="max-w-[200px] truncate text-xs">
                      {tx.description || 'Transação BaaS'}
                    </TableCell>
                    <TableCell className="text-right font-medium">{formatBRL(tx.amount)}</TableCell>
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
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
