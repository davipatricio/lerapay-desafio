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
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { MoneyInput } from '@/components/dashboard/money-input';
import {
  Link2,
  Plus,
  Copy,
  Check,
  ExternalLink,
  QrCode,
  CreditCard,
  Search,
  Calendar,
  ClipboardList,
} from 'lucide-react';
import { toast } from 'sonner';
import { checkoutLinksQueryOptions } from '../../lib/queries';
import { useDashboardQuery } from '../../lib/query/options';
import { useCreateCheckoutLinkMutation } from '../../lib/mutations';
import { formatBRL } from '../../lib/money';
import type { Route } from './+types/checkout';
import { cn } from '@/lib/utils';

export function meta(_: Route.MetaArgs) {
  return [
    { title: 'Links de Checkout | LeraPay' },
    { name: 'description', content: 'Gerenciamento de links de pagamento Pix e Cartão' },
  ];
}

/** Selectable payment-method toggle card. */
function MethodToggle({
  label,
  icon,
  checked,
  onCheckedChange,
  tone,
}: {
  label: string;
  icon: React.ReactNode;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  tone: string;
}) {
  return (
    <label
      className={cn(
        'flex cursor-pointer items-center gap-2 rounded-lg border p-3 transition-colors',
        checked ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/40',
      )}
    >
      <Checkbox checked={checked} onCheckedChange={onCheckedChange} aria-label={label} />
      <span className={cn('flex size-4 items-center justify-center', tone)}>{icon}</span>
      <span className="text-xs font-medium">{label}</span>
    </label>
  );
}

const INSTALLMENT_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 18, 21];
const installmentItems = INSTALLMENT_OPTIONS.map((n) => ({
  value: String(n),
  label: `Até ${n}x ${n === 1 ? '(À vista)' : 'parcelado'}`,
}));

const EXPIRY_OPTIONS = [
  { value: 1, label: '1 dia' },
  { value: 7, label: '7 dias' },
  { value: 15, label: '15 dias' },
  { value: 30, label: '30 dias' },
  { value: 90, label: '90 dias' },
];
const expiryItems = EXPIRY_OPTIONS.map((opt) => ({
  value: String(opt.value),
  label: opt.label,
}));

export default function CheckoutPage(_props: Route.ComponentProps) {
  const { data: links } = useDashboardQuery(checkoutLinksQueryOptions());
  const createMutation = useCreateCheckoutLinkMutation();

  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [amountCents, setAmountCents] = useState(0);
  const [allowPix, setAllowPix] = useState(true);
  const [allowCard, setAllowCard] = useState(true);
  const [maxInstallments, setMaxInstallments] = useState(12);
  const [expiresInDays, setExpiresInDays] = useState(30);

  const handleCopyLink = async (id: string) => {
    const url = `${window.location.origin}/checkout/${id}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast.success('Link de pagamento copiado para a área de transferência!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (amountCents <= 0) {
      toast.error('Informe um valor válido em reais (R$)');
      return;
    }

    if (amountCents < 100) {
      toast.error('O valor mínimo para cobrança é R$ 1,00');
      return;
    }

    if (!allowPix && !allowCard) {
      toast.error('Selecione pelo menos um método de pagamento permitido (Pix ou Cartão)');
      return;
    }

    const allowedMethods: ('PIX' | 'CREDIT_CARD')[] = [];
    if (allowPix) allowedMethods.push('PIX');
    if (allowCard) allowedMethods.push('CREDIT_CARD');

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    try {
      const created = await createMutation.mutateAsync({
        title: title.trim(),
        amount: amountCents,
        allowedMethods,
        maxInstallments: allowCard ? maxInstallments : 1,
        expiresAt: expiresAt.toISOString(),
      });

      toast.success('Link de pagamento criado com sucesso!');
      setIsOpen(false);
      setTitle('');
      setAmountCents(0);

      // Auto copy
      const url = `${window.location.origin}/checkout/${created.id}`;
      await navigator.clipboard.writeText(url);
      toast.info('Link copiado para a área de transferência');
    } catch (err: any) {
      toast.error(err?.message || 'Falha ao criar link de checkout');
    }
  };

  const filteredLinks = links.filter(
    (l) =>
      l.title.toLowerCase().includes(search.toLowerCase()) ||
      l.externalReference?.toLowerCase().includes(search.toLowerCase()),
  );

  const hasNone = links.length === 0;

  return (
    <div className="flex flex-col gap-5">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Links de Checkout</h2>
          <p className="text-sm text-muted-foreground">
            Crie links personalizados de cobrança com Pix instantâneo e Cartão de Crédito
          </p>
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger render={<Button className="gap-2" />}>
            <Plus className="size-4" />
            <span>Novo Link de Checkout</span>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Criar Link de Pagamento</DialogTitle>
              <DialogDescription>
                Configure os parâmetros da cobrança para disponibilizar aos seus clientes.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreate} className="space-y-4 py-2">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="title">Título ou Descrição do Item *</FieldLabel>
                  <FieldDescription>Nome que o cliente verá na tela de pagamento.</FieldDescription>
                  <Input
                    id="title"
                    placeholder="Ex: Mensalidade Curso / Consultoria"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="amount">Valor da Cobrança (R$) *</FieldLabel>
                  <FieldDescription>Valor mínimo de R$ 1,00.</FieldDescription>
                  <MoneyInput
                    id="amount"
                    aria-label="Valor da cobrança em reais"
                    value={amountCents}
                    onValueChange={setAmountCents}
                  />
                </Field>

                <FieldSet>
                  <FieldLegend>Métodos de Pagamento Permitidos</FieldLegend>
                  <div className="grid grid-cols-2 gap-2">
                    <MethodToggle
                      label="Pix"
                      icon={<QrCode className="size-4" />}
                      tone="text-emerald-500"
                      checked={allowPix}
                      onCheckedChange={(c) => setAllowPix(c)}
                    />
                    <MethodToggle
                      label="Cartão"
                      icon={<CreditCard className="size-4" />}
                      tone="text-sky-500"
                      checked={allowCard}
                      onCheckedChange={(c) => setAllowCard(c)}
                    />
                  </div>
                  {!allowPix && !allowCard && (
                    <p className="text-xs text-destructive">
                      Selecione ao menos um método de pagamento.
                    </p>
                  )}
                </FieldSet>

                {allowCard && (
                  <Field>
                    <FieldLabel htmlFor="installments">Máximo de Parcelas no Cartão</FieldLabel>
                    <Select
                      items={installmentItems}
                      value={String(maxInstallments)}
                      onValueChange={(v) => setMaxInstallments(Number(v))}
                    >
                      <SelectTrigger id="installments" size="default" className="w-full">
                        <SelectValue placeholder="Selecione o nº de parcelas" />
                      </SelectTrigger>
                      <SelectContent>
                        {installmentItems.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value} label={opt.label}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                )}

                <Field>
                  <FieldLabel htmlFor="expires">Validade do Link</FieldLabel>
                  <Select
                    items={expiryItems}
                    value={String(expiresInDays)}
                    onValueChange={(v) => setExpiresInDays(Number(v))}
                  >
                    <SelectTrigger id="expires" size="default" className="w-full">
                      <SelectValue placeholder="Selecione a validade" />
                    </SelectTrigger>
                    <SelectContent>
                      {expiryItems.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value} label={opt.label}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Criando...' : 'Criar Link'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Links List Table */}
      <Card>
        <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle className="text-base">Links Criados</CardTitle>
            <CardDescription>
              Compartilhe a URL pública com seus compradores para processar o pagamento
            </CardDescription>
          </div>
          <div className="relative w-full lg:w-72">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por título ou referência..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {hasNone ? (
            <Empty className="p-12">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Link2 />
                </EmptyMedia>
                <EmptyTitle>Nenhum link de checkout criado</EmptyTitle>
                <EmptyDescription>
                  Crie um novo link para começar a aceitar pagamentos com QR Code Pix instantâneo e
                  Cartão de Crédito parcelado.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button size="sm" className="gap-2" onClick={() => setIsOpen(true)}>
                  <Plus className="size-3.5" />
                  <span>Criar Link Agora</span>
                </Button>
              </EmptyContent>
            </Empty>
          ) : filteredLinks.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <Search className="mb-3 size-10 text-muted-foreground/50" />
              <p className="text-sm font-medium">Nenhum link corresponde à busca</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Ajuste o termo pesquisado ou limpe o filtro para ver todos os links.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4 gap-2"
                onClick={() => setSearch('')}
              >
                Limpar busca
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Referência</TableHead>
                  <TableHead>Métodos</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Validade</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLinks.map((link) => {
                  const isCopied = copiedId === link.id;
                  const isExpired = link.expiresAt && new Date(link.expiresAt) < new Date();

                  return (
                    <TableRow key={link.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                            <ClipboardList className="size-3.5" />
                          </span>
                          <span className="max-w-[200px] truncate">{link.title}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {link.externalReference || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {link.allowedMethods.includes('PIX') && (
                            <Badge
                              variant="secondary"
                              className="border-0 bg-emerald-500/10 text-[10px] text-emerald-600"
                            >
                              Pix
                            </Badge>
                          )}
                          {link.allowedMethods.includes('CREDIT_CARD') && (
                            <Badge
                              variant="secondary"
                              className="border-0 bg-sky-500/10 text-[10px] text-sky-600"
                            >
                              Cartão
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatBRL(link.amount)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            link.status === 'ACTIVE' && !isExpired
                              ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600'
                              : 'border-border bg-muted text-muted-foreground'
                          }
                        >
                          {link.status === 'ACTIVE' && !isExpired ? 'Ativo' : 'Concluído'}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden text-xs text-muted-foreground md:table-cell">
                        {link.expiresAt ? (
                          <div className="flex items-center gap-1">
                            <Calendar className="size-3" />
                            <span>{new Date(link.expiresAt).toLocaleDateString('pt-BR')}</span>
                          </div>
                        ) : (
                          'Sem expiração'
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleCopyLink(link.id)}
                            title="Copiar link"
                          >
                            {isCopied ? (
                              <Check className="size-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="size-3.5" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            render={
                              <a
                                href={`/checkout/${link.id}`}
                                target="_blank"
                                rel="noreferrer"
                                title="Abrir página de checkout"
                              />
                            }
                          >
                            <ExternalLink className="size-3.5" />
                          </Button>
                        </div>
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
