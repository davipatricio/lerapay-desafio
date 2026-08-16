import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, KeyRound, Loader2, Mail, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useLinkGatewayMutation, useResetPasswordMutation } from '../lib/mutations/auth';
import type { UserDto } from '../lib/api/types';

interface LinkGatewayModalProps {
  user?: UserDto | null;
  trigger?: React.ReactNode;
  open: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function LinkGatewayModal({
  user,
  trigger,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}: LinkGatewayModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;
  const setIsOpen = isControlled ? setControlledOpen! : setInternalOpen;

  const [document, setDocument] = useState(user?.document || '');
  const [gatewayPassword, setGatewayPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const linkMutation = useLinkGatewayMutation();
  const resetMutation = useResetPasswordMutation();

  const isTokenExpired =
    user?.gatewayAccount?.isLinked && user?.gatewayAccount?.tokenExpiresAt
      ? new Date(user.gatewayAccount.tokenExpiresAt) < new Date()
      : false;

  const handleLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanDoc = document.replace(/\D/g, '');
    if (!cleanDoc) {
      setErrorMsg('Informe o CPF ou CNPJ cadastrado no gateway.');
      return;
    }
    if (!gatewayPassword) {
      setErrorMsg('Informe a senha recebida por e-mail.');
      return;
    }

    try {
      await linkMutation.mutateAsync({
        document: cleanDoc,
        gatewayPassword,
      });
      toast.success(
        isTokenExpired ? 'Gateway re-autenticado com sucesso!' : 'Gateway vinculado com sucesso!',
      );
      setGatewayPassword('');
      setIsOpen(false);
    } catch (err: any) {
      setErrorMsg(
        err?.message ||
          'Não foi possível vincular. Verifique se a senha informada é a mesma enviada por e-mail pelo Gateway.',
      );
    }
  };

  const handleResetPassword = async () => {
    setErrorMsg(null);
    try {
      const res = await resetMutation.mutateAsync({
        email: user?.email,
        document: user?.document ? user.document.replace(/\D/g, '') : undefined,
      });
      toast.success(res.message || 'Instruções de redefinição de senha enviadas por e-mail.');
    } catch (err: any) {
      toast.error(err?.message || 'Falha ao solicitar nova senha do gateway.');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger && <DialogTrigger render={trigger as any} />}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary mb-1">
            <ShieldCheck className="size-5" />
            <DialogTitle>Vincular Conta do Gateway Lera Box</DialogTitle>
          </div>
          <DialogDescription>
            Conecte sua conta do gateway informando a senha de acesso enviada para seu e-mail{' '}
            <strong className="text-foreground">{user?.email}</strong> pelo processador Lera Box.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleLink} className="space-y-4 py-2">
          {errorMsg && (
            <div className="flex items-start gap-2.5 rounded-md border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="doc">CPF / CNPJ do Titular</Label>
            <Input
              id="doc"
              placeholder="000.000.000-00"
              value={document}
              onChange={(e) => setDocument(e.target.value)}
              disabled={linkMutation.isPending}
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="pass">Senha do Gateway (recebida por e-mail)</Label>
              <button
                type="button"
                onClick={handleResetPassword}
                disabled={resetMutation.isPending}
                className="text-[11px] text-primary hover:underline flex items-center gap-1"
              >
                {resetMutation.isPending ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <Mail className="size-3" />
                )}
                Reenviar senha por e-mail
              </button>
            </div>
            <Input
              id="pass"
              type="password"
              placeholder="••••••••"
              value={gatewayPassword}
              onChange={(e) => setGatewayPassword(e.target.value)}
              disabled={linkMutation.isPending}
              autoFocus
            />
          </div>

          <DialogFooter className="pt-2 flex flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={linkMutation.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={linkMutation.isPending} className="gap-2">
              {linkMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <KeyRound className="size-4" />
              )}
              <span>Vincular Gateway</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
