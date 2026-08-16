import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { PageHeader } from '@/components/dashboard/page-header';
import { EmptyState } from '@/components/dashboard/empty-state';
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
import { Webhook, Plus, Trash2, RefreshCw, Check, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { getWebhookEventLabel } from '@/lib/dashboard';
import { getErrorPresentation } from '@/lib/api/errors';
import { copyToClipboard } from '@/lib/utils';
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
  { id: 'PAYMENT_PIX' as const, label: 'Pagamento Pix (Aprovado / Expirado)' },
  { id: 'PAYMENT_CARD' as const, label: 'Pagamento Cartão de Crédito (Aprovado / Negado)' },
  { id: 'WITHDRAWAL' as const, label: 'Saques & Transferências (Concluído / Falha)' },
];

export default function WebhooksPage(_props: Route.ComponentProps) {
  const { data: webhooks, refetch, isRefetching } = useDashboardQuery(webhooksListQueryOptions());
  const upsertMutation = useUpsertWebhookMutation();
  const deleteMutation = useDeleteWebhookMutation();

  const [isOpen, setIsOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>(['PAYMENT_PIX']);
  const [active, setActive] = useState<boolean>(true);
  const [copiedSecret, setCopiedSecret] = useState<string | null>(null);
  const [webhookToDelete, setWebhookToDelete] = useState<string | null>(null);

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
        event: selectedEvents[0] as 'PAYMENT_PIX' | 'PAYMENT_CARD' | 'WITHDRAWAL',
      });

      toast.success('Webhook registrado com sucesso no gateway Lera Box!');
      setIsOpen(false);
      setUrl('');
      setActive(true);
    } catch (err: unknown) {
      const presentation = getErrorPresentation(err);
      toast.error(presentation.title, { description: presentation.message });
    }
  };

  const handleDelete = async () => {
    if (!webhookToDelete) return;

    try {
      await deleteMutation.mutateAsync(webhookToDelete);
      toast.success('Webhook removido com sucesso!');
      setWebhookToDelete(null);
    } catch (err: unknown) {
      const presentation = getErrorPresentation(err);
      toast.error(presentation.title, { description: presentation.message });
    }
  };

  const handleCopySecret = async (secret: string) => {
    const copied = await copyToClipboard(secret);
    if (!copied) {
      toast.error('Não foi possível copiar o segredo', {
        description: 'Copie o valor em um navegador com acesso à área de transferência.',
      });
      return;
    }

    setCopiedSecret(secret);
    toast.success('Segredo HMAC copiado!');
    setTimeout(() => setCopiedSecret(null), 2000);
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Webhooks"
        description="Gerencie endpoints que recebem notificações autenticadas de pagamentos e saques em tempo real."
        actions={
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isRefetching}
              className="flex-1 gap-2 sm:flex-none"
            >
              <RefreshCw className={`size-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
              <span>Atualizar</span>
            </Button>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger render={<Button size="sm" className="flex-1 gap-2 sm:flex-none" />}>
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
                    <p className="text-xs text-muted-foreground">
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
                              isChecked
                                ? 'border-primary bg-primary/5 font-medium'
                                : 'border-border'
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
                    <div className="flex items-center">
                      <Switch
                        checked={active}
                        onCheckedChange={(checked) => setActive(checked)}
                        className="mr-2"
                      />
                      <span className="text-sm text-muted-foreground">
                        {active ? 'Ativo (recebendo notificações)' : 'Inativo (suspenso)'}
                      </span>
                    </div>
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
        }
      />

      <AlertDialog
        open={webhookToDelete !== null}
        onOpenChange={(open) => !open && setWebhookToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover webhook?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação cancela a assinatura e interrompe as notificações enviadas para esse
              endpoint.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Removendo...' : 'Remover webhook'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
            <div className="p-6">
              <EmptyState
                icon={Webhook}
                title="Nenhum webhook registrado"
                description="Cadastre a URL do seu sistema para ser notificado instantaneamente quando pagamentos Pix ou Cartão forem confirmados."
                action={
                  <Button size="sm" className="gap-2" onClick={() => setIsOpen(true)}>
                    <Plus className="size-3.5" />
                    <span>Cadastrar Primeiro Webhook</span>
                  </Button>
                }
              />
            </div>
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
                        <Badge variant="secondary" className="text-xs">
                          {getWebhookEventLabel(wh.event)}
                        </Badge>
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
                            aria-label={`Copiar segredo HMAC de ${wh.url}`}
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
                        className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                      >
                        Ativo
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setWebhookToDelete(wh.id)}
                        title="Excluir Webhook"
                        aria-label={`Excluir webhook ${wh.url}`}
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
    </div>
  );
}
