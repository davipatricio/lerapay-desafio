import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Empty,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from '@/components/ui/empty';
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
import { Webhook, Plus, Trash2, RefreshCw, ShieldCheck, Check, Copy, Activity } from 'lucide-react';
import { toast } from 'sonner';
import { webhooksListQueryOptions } from '../../lib/queries';
import { useDashboardQuery } from '../../lib/query/options';
import { useUpsertWebhookMutation, useDeleteWebhookMutation } from '../../lib/mutations';
import type { Route } from './+types/webhooks';

export function meta(_: Route.MetaArgs) {
  return [
    { title: 'Webhooks | LeraPay' },
    { name: 'description', content: 'Configuração e auditoria de notificações assíncronas' },
  ];
}

const AVAILABLE_EVENTS = [
  { id: 'PAYMENT_PIX', label: 'Pagamento Pix (Aprovado / Expirado)' },
  { id: 'PAYMENT_CARD', label: 'Pagamento Cartão de Crédito (Aprovado / Negado)' },
  { id: 'WITHDRAWAL', label: 'Saques & Transferências (Concluído / Falha)' },
];

const WEBHOOK_STATUS_ITEMS = [
  { value: 'active', label: 'Ativo (recebendo notificações)' },
  { value: 'inactive', label: 'Inativo (suspenso)' },
];

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-bold tracking-tight tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}

export default function WebhooksPage(_props: Route.ComponentProps) {
  const { data: webhooks, refetch, isRefetching } = useDashboardQuery(webhooksListQueryOptions());
  const upsertMutation = useUpsertWebhookMutation();
  const deleteMutation = useDeleteWebhookMutation();

  const [isOpen, setIsOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>([
    'PAYMENT_PIX',
    'PAYMENT_CARD',
    'WITHDRAWAL',
  ]);
  const [active, setActive] = useState<string>('active');
  const [copiedSecret, setCopiedSecret] = useState<string | null>(null);

  const handleStatusChange = (value: string | null) => setActive(value ?? 'active');

  const handleToggleEvent = (eventId: string) => {
    setSelectedEvents((prev) =>
      prev.includes(eventId) ? prev.filter((e) => e !== eventId) : [...prev, eventId],
    );
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!url.trim() || (!url.startsWith('http://') && !url.startsWith('https://'))) {
      toast.error('Informe uma URL de webhook válida (iniciando com http:// ou https://)');
      return;
    }

    if (selectedEvents.length === 0) {
      toast.error('Selecione pelo menos um evento para inscrição');
      return;
    }

    try {
      await upsertMutation.mutateAsync({
        url: url.trim(),
        events: selectedEvents,
        active: active === 'active',
      });

      toast.success('Webhook registrado com sucesso no gateway Lera Box!');
      setIsOpen(false);
      setUrl('');
      setActive('active');
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao registrar webhook');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente remover esta assinatura de webhook?')) return;

    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Webhook removido com sucesso!');
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao remover webhook');
    }
  };

  const handleCopySecret = async (secret: string) => {
    await navigator.clipboard.writeText(secret);
    setCopiedSecret(secret);
    toast.success('Segredo HMAC copiado!');
    setTimeout(() => setCopiedSecret(null), 2000);
  };

  const totalSubscriptions = webhooks.reduce((sum, wh) => sum + (wh.events?.length || 0), 0);
  const activeCount = webhooks.filter((wh) => wh.active).length;

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Webhooks</h2>
          <p className="text-sm text-muted-foreground">
            Gerencie endpoints que recebem notificações de eventos de pagamentos e saques em tempo
            real
          </p>
        </div>

        <div className="flex items-center gap-2">
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

          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger render={<Button size="sm" className="gap-2" />}>
              <Plus className="size-4" />
              <span>Novo Webhook</span>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Cadastrar Endpoint Webhook</DialogTitle>
                <DialogDescription>
                  Inscreva uma URL externa para receber notificações HTTP POST autenticadas via
                  HMAC.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleCreate} className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <Label htmlFor="url">URL do Endpoint de Destino *</Label>
                  <Input
                    id="url"
                    placeholder="https://seu-dominio.com.br/api/webhooks"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    required
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Deve responder com status HTTP 200 OK para confirmar o recebimento
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Eventos Inscritos *</Label>
                  <div className="space-y-2">
                    {AVAILABLE_EVENTS.map((event) => {
                      const isChecked = selectedEvents.includes(event.id);
                      return (
                        <label
                          key={event.id}
                          className={`flex cursor-pointer items-center gap-2.5 rounded-lg border p-3 text-xs transition-colors ${
                            isChecked ? 'border-primary bg-primary/5 font-medium' : 'border-border'
                          }`}
                        >
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={() => handleToggleEvent(event.id)}
                          />
                          <span>{event.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    items={WEBHOOK_STATUS_ITEMS}
                    value={active}
                    onValueChange={handleStatusChange}
                  >
                    <SelectTrigger id="status" className="w-full">
                      <SelectValue placeholder="Status do endpoint" />
                    </SelectTrigger>
                    <SelectContent>
                      {WEBHOOK_STATUS_ITEMS.map((item) => (
                        <SelectItem key={item.value} value={item.value} label={item.label}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <DialogFooter className="mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsOpen(false)}
                    disabled={upsertMutation.isPending}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={upsertMutation.isPending}>
                    {upsertMutation.isPending ? 'Salvando...' : 'Cadastrar Webhook'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Operational summary strip */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <MiniStat label="Endpoints registrados" value={webhooks.length} />
        <MiniStat label="Inscrições de eventos" value={totalSubscriptions} />
        <MiniStat label="Endpoints ativos" value={activeCount} />
      </div>

      {/* Webhooks Registered Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Endpoints Ativos</CardTitle>
          <CardDescription>
            Assinaturas registradas no Lera Box Gateway para sua conta
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {webhooks.length === 0 ? (
            <Empty className="py-12">
              <EmptyMedia variant="icon">
                <Webhook />
              </EmptyMedia>
              <EmptyContent>
                <EmptyTitle>Nenhum webhook registrado</EmptyTitle>
                <EmptyDescription>
                  Cadastre a URL do seu sistema para ser notificado instantaneamente quando
                  pagamentos Pix ou Cartão forem confirmados.
                </EmptyDescription>
                <Button size="sm" className="mt-2 gap-2" onClick={() => setIsOpen(true)}>
                  <Plus className="size-3.5" />
                  <span>Cadastrar Primeiro Webhook</span>
                </Button>
              </EmptyContent>
            </Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>URL de Destino</TableHead>
                  <TableHead>Eventos Inscritos</TableHead>
                  <TableHead>Segredo HMAC</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {webhooks.map((wh) => (
                  <TableRow key={wh.id}>
                    <TableCell className="font-mono text-xs max-w-[240px] truncate">
                      {wh.url}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {wh.events?.map((ev) => (
                          <Badge key={ev} variant="secondary" className="text-[10px]">
                            {ev}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      {wh.secret ? (
                        <div className="flex items-center gap-1.5 font-mono text-xs">
                          <span>••••••••••••</span>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleCopySecret(wh.secret!)}
                            title="Copiar segredo HMAC"
                          >
                            {copiedSecret === wh.secret ? (
                              <Check className="size-3 text-emerald-600" />
                            ) : (
                              <Copy className="size-3" />
                            )}
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Padrão da loja</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          wh.active
                            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                            : 'bg-muted text-muted-foreground border-border'
                        }
                      >
                        {wh.active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleDelete(wh.id)}
                        title="Excluir Webhook"
                        className="text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Developer Docs / Security Card */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="border-primary/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-5 text-primary" />
              <CardTitle className="text-base">Assinatura HMAC SHA-256</CardTitle>
            </div>
            <CardDescription>
              Validação de integridade nos eventos enviados pelo gateway
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs text-muted-foreground">
            <p>
              Todas as requisições de webhook enviadas pelo Lera Box Gateway contêm o cabeçalho{' '}
              <code className="bg-muted px-1 py-0.5 rounded text-foreground font-mono">
                X-Lera-Box-Signature
              </code>
              .
            </p>
            <p>
              A assinatura é gerada usando o algoritmo <strong>HMAC SHA-256</strong> com o corpo da
              requisição (raw payload) e a sua chave secreta da loja.
            </p>
            <div className="rounded-md bg-muted/60 p-3 font-mono text-[11px] text-foreground space-y-1">
              <p className="text-muted-foreground">// Validação no seu backend:</p>
              <p>const signature = req.headers['x-lera-box-signature'];</p>
              <p>
                const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
              </p>
              <p>const isValid = signature === expected;</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Activity className="size-5 text-sky-500" />
              <CardTitle className="text-base">Idempotência & Auditoria</CardTitle>
            </div>
            <CardDescription>Tratamento robusto contra retentativas automáticas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs text-muted-foreground">
            <p>
              O receptor BaaS da aplicação (
              <code className="bg-muted px-1 py-0.5 rounded text-foreground font-mono">
                POST /api/webhooks/gateway
              </code>
              ) registra o identificador de cada evento na tabela de auditoria{' '}
              <code className="bg-muted px-1 py-0.5 rounded text-foreground font-mono">
                webhook_events
              </code>
              .
            </p>
            <p>
              Eventos duplicados são descartados automaticamente por idempotência garantida,
              evitando dupla liberação de pedidos ou saques repetidos.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
