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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { EmptyState } from '@/components/dashboard/empty-state';
import { PageHeader } from '@/components/dashboard/page-header';
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { MoneyInput } from '@/components/dashboard/money-input';
import { SummaryStrip } from '@/components/dashboard/summary-strip';
import { StatusBadge } from '@/components/dashboard/status-badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowDownToLine,
  Plus,
  Wallet,
  ArrowUpRight,
  RefreshCw,
  Clock,
  KeyRound,
} from 'lucide-react';
import { toast } from 'sonner';
import { walletBalanceQueryOptions, withdrawalsListQueryOptions } from '../../lib/queries';
import { useDashboardQuery } from '../../lib/query/options';
import { useCreateWithdrawalMutation } from '../../lib/mutations';
import { getSessionUser } from '../../lib/auth/token';
import { formatBRL } from '../../lib/money';
import type { Route } from './+types/withdrawals';
import { getErrorPresentation } from '@/lib/api/errors';

export function meta(_: Route.MetaArgs) {
  return [
    { title: 'Saques & Transferências | LeraPay' },
    { name: 'description', content: 'Solicitação de saques via Pix e acompanhamento' },
  ];
}

const PIX_KEY_TYPES = [
  { value: 'CPF', label: 'CPF' },
  { value: 'CNPJ', label: 'CNPJ' },
  { value: 'EMAIL', label: 'E-mail' },
  { value: 'PHONE', label: 'Telefone' },
  { value: 'RANDOM', label: 'Chave Aleatória (EVP)' },
] as const;

type PixKeyType = 'CPF' | 'CNPJ' | 'EMAIL' | 'PHONE' | 'RANDOM';

export default function WithdrawalsPage(_props: Route.ComponentProps) {
  const user = getSessionUser();
  const { data: wallet, refetch: refetchWallet } = useDashboardQuery(walletBalanceQueryOptions());
  const {
    data: withdrawals,
    refetch: refetchList,
    isRefetching,
  } = useDashboardQuery(withdrawalsListQueryOptions());
  const createMutation = useCreateWithdrawalMutation();

  const [isOpen, setIsOpen] = useState(false);
  const [amountCents, setAmountCents] = useState(0);
  const [pixKeyType, setPixKeyType] = useState<PixKeyType>('CPF');
  const [pixKey, setPixKey] = useState('');
  const [isReviewing, setIsReviewing] = useState(false);
  const [createError, setCreateError] = useState<ReturnType<typeof getErrorPresentation> | null>(
    null,
  );

  const availableBalance = wallet?.balance ?? 0;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (amountCents <= 0) {
      toast.error('Informe um valor válido em reais (R$)');
      return;
    }

    if (amountCents < 100) {
      toast.error('O valor mínimo de saque é R$ 1,00');
      return;
    }

    if (amountCents > availableBalance) {
      toast.error(`Saldo insuficiente. Seu saldo disponível é ${formatBRL(availableBalance)}.`);
      return;
    }

    if (!pixKey.trim()) {
      toast.error('Informe a chave Pix de destino');
      return;
    }

    if (!isReviewing) {
      setIsReviewing(true);
      return;
    }

    setCreateError(null);

    try {
      await createMutation.mutateAsync({
        amount: amountCents,
        pixKey: pixKey.trim(),
        pixKeyType,
      });

      toast.success('Solicitação de saque enviada com sucesso ao gateway!');
      setIsOpen(false);
      setIsReviewing(false);
      setAmountCents(0);
      setPixKey('');
    } catch (err: unknown) {
      const presentation = getErrorPresentation(err);
      setCreateError(presentation);
      toast.error(presentation.title);
    }
  };

  const handleRefresh = () => {
    refetchWallet();
    refetchList();
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Saques"
        description="Transfira seu saldo disponível para sua conta bancária via Pix."
        actions={
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefetching}
              className="gap-2"
            >
              <RefreshCw className={`size-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
              <span>Atualizar</span>
            </Button>

            <Dialog
              open={isOpen}
              onOpenChange={(open) => {
                setIsOpen(open);
                if (!open) {
                  setIsReviewing(false);
                  setCreateError(null);
                }
              }}
            >
              <DialogTrigger
                render={
                  <Button
                    size="sm"
                    className="w-full gap-2 sm:w-auto"
                    aria-label="Solicitar saque via Pix"
                  />
                }
              >
                <Plus className="size-4" aria-hidden="true" />
                <span>Solicitar Saque Pix</span>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Solicitar Saque via Pix</DialogTitle>
                  <DialogDescription>
                    O valor será transferido diretamente para a chave Pix indicada.
                  </DialogDescription>
                </DialogHeader>

                {createError ? (
                  <Alert variant="destructive" className="-mb-1">
                    <AlertTitle>{createError.title}</AlertTitle>
                    <AlertDescription>
                      {createError.message}
                      {createError.correlationId ? ` Código: ${createError.correlationId}` : ''}
                    </AlertDescription>
                  </Alert>
                ) : null}

                <form onSubmit={handleCreate} className="space-y-4 py-2">
                  {isReviewing ? (
                    <Alert>
                      <AlertTitle>Revise o saque antes de confirmar</AlertTitle>
                      <AlertDescription>
                        Você está solicitando <strong>{formatBRL(amountCents)}</strong> para a chave{' '}
                        <strong className="break-all">{pixKey.trim()}</strong> ({pixKeyType}). Essa
                        operação não pode ser desfeita depois de enviada.
                      </AlertDescription>
                    </Alert>
                  ) : null}

                  <div className="flex items-center justify-between rounded-lg border bg-muted/40 p-3 text-xs">
                    <span className="text-muted-foreground">Saldo disponível para saque:</span>
                    <span className="text-sm font-bold text-primary">
                      {formatBRL(availableBalance)}
                    </span>
                  </div>

                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="amount">Valor do Saque (R$) *</FieldLabel>
                      <FieldDescription>Mínimo de R$ 1,00 e limitado ao saldo.</FieldDescription>
                      <MoneyInput
                        id="amount"
                        aria-label="Valor do saque em reais"
                        value={amountCents}
                        onValueChange={setAmountCents}
                      />
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="pixKeyType">Tipo de Chave Pix *</FieldLabel>
                      <Select
                        items={PIX_KEY_TYPES}
                        value={pixKeyType}
                        onValueChange={(v) => setPixKeyType(v as PixKeyType)}
                      >
                        <SelectTrigger id="pixKeyType" size="default" className="w-full">
                          <SelectValue placeholder="Selecione o tipo de chave" />
                        </SelectTrigger>
                        <SelectContent>
                          {PIX_KEY_TYPES.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value} label={opt.label}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="pixKey">Chave Pix de Destino *</FieldLabel>
                      <FieldDescription>
                        Confirme se a chave pertence ao titular da conta.
                      </FieldDescription>
                      <div className="relative">
                        <KeyRound className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="pixKey"
                          placeholder="Informe a chave Pix"
                          className="pl-9"
                          value={pixKey}
                          onChange={(e) => setPixKey(e.target.value)}
                          required
                        />
                      </div>
                    </Field>
                  </FieldGroup>

                  <DialogFooter className="mt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        if (isReviewing) {
                          setIsReviewing(false);
                        } else {
                          setIsOpen(false);
                        }
                      }}
                      disabled={createMutation.isPending}
                    >
                      {isReviewing ? 'Voltar' : 'Cancelar'}
                    </Button>
                    <Button
                      type="submit"
                      disabled={
                        createMutation.isPending ||
                        availableBalance < 100 ||
                        (amountCents > 0 && amountCents > availableBalance)
                      }
                    >
                      {createMutation.isPending
                        ? 'Enviando...'
                        : isReviewing
                          ? 'Confirmar e enviar saque'
                          : 'Revisar saque'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      <SummaryStrip
        columns="sm:grid-cols-3"
        items={[
          {
            key: 'available-balance',
            label: 'Saldo disponível',
            value: formatBRL(availableBalance),
            sub: 'Disponível para saque imediato',
            icon: Wallet,
            featured: true,
          },
          {
            key: 'total-requested',
            label: 'Total solicitado',
            value: formatBRL(withdrawals.reduce((sum, w) => sum + (w.amount || 0), 0)),
            sub: `${withdrawals.length} saque(s) no total`,
            icon: ArrowUpRight,
          },
          ...(!user?.gatewayAccount?.isLinked
            ? [
                {
                  key: 'gateway',
                  label: 'Gateway',
                  value: 'Pendente',
                  sub: 'Vincule para processar saques automaticamente',
                  icon: Clock,
                  tone: 'warning' as const,
                },
              ]
            : []),
        ]}
      />

      {/* Withdrawals List Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Histórico de Saques</CardTitle>
          <CardDescription>Registro de todas as transferências Pix solicitadas</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {withdrawals.length === 0 ? (
            <EmptyState
              className="p-12"
              icon={ArrowDownToLine}
              title="Nenhum saque realizado ainda"
              description="Quando tiver saldo disponível de vendas, você poderá transferir via Pix a qualquer momento."
              action={
                <Button
                  size="sm"
                  className="gap-2"
                  onClick={() => setIsOpen(true)}
                  disabled={availableBalance < 100}
                >
                  <Plus className="size-3.5" aria-hidden="true" />
                  <span>Solicitar primeiro saque</span>
                </Button>
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data da Solicitação</TableHead>
                  <TableHead>Chave Pix de Destino</TableHead>
                  <TableHead className="text-right">Valor Solicitado</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {withdrawals.map((w) => (
                  <TableRow key={w.id}>
                    <TableCell className="text-xs text-muted-foreground">
                      {w.createdAt ? new Date(w.createdAt).toLocaleString('pt-BR') : '-'}
                    </TableCell>
                    <TableCell
                      className="max-w-[180px] truncate font-mono text-xs"
                      title={w.pixKey}
                    >
                      {w.pixKey}
                    </TableCell>
                    <TableCell className="text-right text-sm font-semibold tabular-nums">
                      {formatBRL(w.amount)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={w.status} />
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
