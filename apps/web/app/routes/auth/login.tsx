import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { toast } from 'sonner';
import { useAppForm } from '../../lib/forms';
import { useLoginMutation } from '../../lib/mutations/auth';
import { queryKeys } from '../../lib/query/keys';
import { setAccessToken, setSessionUser } from '../../lib/auth/token';
import { ApiClientError } from '../../lib/api/errors';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import type { Route } from './+types/login';

export function meta(_: Route.MetaArgs) {
  return [{ title: 'Entrar | LeraPay' }];
}

const loginSchema = z.object({
  emailOrDocument: z.string().min(1, 'Informe seu e-mail ou CPF/CNPJ'),
  password: z.string().min(1, 'Informe sua senha'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loginMutation = useLoginMutation();

  const form = useAppForm({
    defaultValues: {
      emailOrDocument: '',
      password: '',
    } as LoginForm,
    validators: {
      onSubmit: ({ value }) => {
        const result = loginSchema.safeParse(value);
        return result.success ? undefined : (result.error.issues[0]?.message ?? 'Dados inválidos');
      },
    },
    onSubmit: async ({ value }) => {
      setErrorMessage(null);
      try {
        const res = await loginMutation.mutateAsync({
          emailOrDocument: value.emailOrDocument,
          password: value.password,
        });
        setAccessToken(res.accessToken);
        setSessionUser(res.user);
        await queryClient.invalidateQueries({ queryKey: queryKeys.auth.all() });
        toast.success(`Bem-vindo, ${res.user.name.split(' ')[0] || 'lojista'}!`);
        navigate('/dashboard', { replace: true });
      } catch (err) {
        if (err instanceof ApiClientError) {
          setErrorMessage(err.message);
        } else {
          setErrorMessage('Não foi possível entrar. Tente novamente.');
        }
      }
    },
  });

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">LeraPay</CardTitle>
          <CardDescription>Entre na sua conta de lojista</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
          >
            <form.AppField
              name="emailOrDocument"
              validators={{
                onChange: ({ value }: { value: string }) =>
                  value.length > 0 ? undefined : 'Informe seu e-mail ou CPF/CNPJ',
              }}
            >
              {(field) => (
                <div className="flex flex-col gap-2">
                  <Label htmlFor={field.name}>E-mail ou CPF/CNPJ</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="text"
                    autoComplete="username"
                    placeholder="voce@exemplo.com"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    aria-invalid={field.state.meta.isTouched && field.state.meta.errors.length > 0}
                  />
                  {field.state.meta.isTouched && field.state.meta.errors.length > 0 ? (
                    <p className="text-sm text-destructive">{field.state.meta.errors[0]}</p>
                  ) : null}
                </div>
              )}
            </form.AppField>

            <form.AppField
              name="password"
              validators={{
                onChange: ({ value }: { value: string }) =>
                  value.length > 0 ? undefined : 'Informe sua senha',
              }}
            >
              {(field) => (
                <div className="flex flex-col gap-2">
                  <Label htmlFor={field.name}>Senha</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    aria-invalid={field.state.meta.isTouched && field.state.meta.errors.length > 0}
                  />
                  {field.state.meta.isTouched && field.state.meta.errors.length > 0 ? (
                    <p className="text-sm text-destructive">{field.state.meta.errors[0]}</p>
                  ) : null}
                </div>
              )}
            </form.AppField>

            {errorMessage ? (
              <div className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {errorMessage}
              </div>
            ) : null}

            <Button type="submit" size="lg" className="w-full" disabled={loginMutation.isPending}>
              {loginMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Ainda não tem conta?{' '}
            <Link
              to="/auth/register"
              className="font-medium text-foreground underline underline-offset-4"
            >
              Cadastre-se
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
