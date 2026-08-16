import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { MoneyInput } from '@/components/dashboard/money-input';
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
  type LucideIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { walletBalanceQueryOptions, withdrawalsListQueryOptions } from '../../lib/queries';
import { useDashboardQuery } from '../../lib/query/options';
import { useCreateWithdrawalMutation } from '../../lib/mutations';
import { getSessionUser } from '../../lib/auth/token';
import { formatBRL } from '../../lib/money';
import type { Route } from './+types/withdrawals';

export function meta(_: Route.MetaArgs) {
  return [
    { title: 'Saques & Transferências | LeraPay' },
    { name: 'description', content: 'Solicitação de saques via Pix e acompanhamento' },
  ];
}

const statusTone: Record<string, string> = {
  APPROVED: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  COMPLETED: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  PENDING: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  PROCESSING: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  DENIED: 'bg-red-500/10 text-red-600 border-red-500/20',
  FAILED: 'bg-red-500/10 text-red-600 border-red-500/20',
};

const statusLabel: Record<string, string> = {
  APPROVED: 'Concluído',
  COMPLETED: 'Concluído',
  PENDING: 'Pendente',
  PROCESSING: 'Processando',
  DENIED: 'Negado',
  FAILED: 'Falhou',
};

const PIX_KEY_TYPES = [
  { value: 'CPF', label: 'CPF' },
  { value: 'CNPJ', label: 'CNPJ' },
  { value: 'EMAIL', label: 'E-mail' },
  { value: 'PHONE', label: 'Telefone' },
  { value: 'RANDOM', label: 'Chave Aleatória (EVP)' },
] as const;

type PixKeyType = 'CPF' | 'CNPJ' | 'EMAIL' | 'PHONE' | 'RANDOM';

function BalanceCard({
  title,
  value,
  sub,
  icon: Icon,
  accent = false,
}: {
  title: string;
  value: string;
  sub: string;
  icon: LucideIcon;
  accent?: boolean;
}) {
  return (
    <Card className={accent ? 'border-primary/20 bg-primary/5' : ''}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className={cn('text-xs font-medium', accent && 'text-primary')}>{title}</span>
          <Icon className={cn('size-4', accent && 'text-primary')} />
        </div>
        <p className={cn('mt-3 text-2xl font-bold tracking-tight', accent && 'text-primary')}>
          {value}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
      </CardContent>
    </Card>
  );
}

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

    try {
      await createMutation.mutateAsync({
        amount: amountCents,
        pixKey: pixKey.trim(),
        pixKeyType,
      });

      toast.success('Solicitação de saque enviada com sucesso ao gateway!');
      setIsOpen(false);
      setAmountCents(0);
      setPixKey('');
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao processar saque');
    }
  };

  const handleRefresh = () => {
    refetchWallet();
    refetchList();
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Saques</h2>
          <p className="text-sm text-muted-foreground">
            Transfira seu saldo disponível para sua conta bancária via Pix instantâneo
          </p>
        </div>

        <div className="flex items-center gap-2">
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

          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger render={<Button size="sm" className="gap-2" />}>
              <Plus className="size-4" />
              <span>Solicitar Saque Pix</span>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Solicitar Saque via Pix</DialogTitle>
                <DialogDescription>
                  O valor será transferido diretamente para a chave Pix indicada.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleCreate} className="space-y-4 py-2">
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
                    onClick={() => setIsOpen(false)}
                    disabled={createMutation.isPending}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={
                      createMutation.isPending ||
                      availableBalance < 100 ||
                      (amountCents > 0 && amountCents > availableBalance)
                    }
                  >
                    {createMutation.isPending ? 'Enviando...' : 'Confirmar Saque'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Balance Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <BalanceCard
          title="Saldo Disponível"
          value={formatBRL(availableBalance)}
          sub="Disponível para saque imediato"
          icon={Wallet}
          accent
        />
        <BalanceCard
          title="Total Solicitado"
          value={formatBRL(withdrawals.reduce((sum, w) => sum + (w.amount || 0), 0))}
          sub={`${withdrawals.length} saque(s) no total`}
          icon={ArrowUpRight}
        />
        {!user?.gatewayAccount?.isLinked && (
          <BalanceCard
            title="Gateway"
            value="Pendente"
            sub="Vincule para processar saques automaticamente"
            icon={Clock}
          />
        )}
      </div>

      {/* Withdrawals List Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Histórico de Saques</CardTitle>
          <CardDescription>Registro de todas as transferências Pix solicitadas</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {withdrawals.length === 0 ? (
            <Empty className="p-12">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <ArrowDownToLine />
                </EmptyMedia>
                <EmptyTitle>Nenhum saque realizado ainda</EmptyTitle>
                <EmptyDescription>
                  Quando tiver saldo disponível de vendas, você poderá transferir via Pix a qualquer
                  momento.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button
                  size="sm"
                  className="gap-2"
                  onClick={() => setIsOpen(true)}
                  disabled={availableBalance < 100}
                >
                  <Plus className="size-3.5" />
                  <span>Solicitar primeiro saque</span>
                </Button>
              </EmptyContent>
            </Empty>
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
                    <TableCell className="font-mono text-xs">{w.pixKey}</TableCell>
                    <TableCell className="text-right text-sm font-bold">
                      {formatBRL(w.amount)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={statusTone[w.status] || statusTone.PENDING}
                      >
                        {statusLabel[w.status] || w.status}
                      </Badge>
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
