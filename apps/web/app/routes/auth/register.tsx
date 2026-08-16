import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { toast } from 'sonner';
import { useAppForm } from '../../lib/forms';
import { useRegisterMutation } from '../../lib/mutations/auth';
import { queryKeys } from '../../lib/query/keys';
import { setAccessToken, setSessionUser } from '../../lib/auth/token';
import { ApiClientError } from '../../lib/api/errors';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, User, Building2, MapPin, ChevronDown, ChevronUp } from 'lucide-react';
import type { Route } from './+types/register';

export function meta(_: Route.MetaArgs) {
  return [{ title: 'Criar conta | LeraPay' }];
}

const registerSchema = z.object({
  personType: z.enum(['PF', 'PJ']),
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Informe um e-mail válido'),
  document: z.string().min(11, 'Informe um CPF ou CNPJ válido'),
  phone: z.string().min(10, 'Informe um telefone com DDD válido'),
  password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
  tradingName: z.string().optional(),
  zipCode: z.string().optional(),
  address: z.string().optional(),
  number: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function Register() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showAddress, setShowAddress] = useState(false);

  const registerMutation = useRegisterMutation();

  const form = useAppForm({
    defaultValues: {
      personType: 'PF',
      name: '',
      email: '',
      document: '',
      phone: '',
      password: '',
      tradingName: '',
      zipCode: '',
      address: '',
      number: '',
      neighborhood: '',
      city: '',
      state: '',
    } as RegisterForm,
    validators: {
      onSubmit: ({ value }) => {
        const result = registerSchema.safeParse(value);
        return result.success ? undefined : (result.error.issues[0]?.message ?? 'Dados inválidos');
      },
    },
    onSubmit: async ({ value }) => {
      setErrorMessage(null);
      try {
        // Strip non-digits from document, phone, and zipCode
        const cleanedDoc = value.document.replace(/\D/g, '');
        const cleanedPhone = value.phone.replace(/\D/g, '');
        const cleanedZip = value.zipCode ? value.zipCode.replace(/\D/g, '') : undefined;

        const payload = {
          name: value.name.trim(),
          email: value.email.trim().toLowerCase(),
          password: value.password,
          document: cleanedDoc,
          phone: cleanedPhone,
          personType: value.personType,
          ...(value.personType === 'PJ' && value.tradingName?.trim()
            ? { tradingName: value.tradingName.trim() }
            : {}),
          ...(cleanedZip ? { zipCode: cleanedZip } : {}),
          ...(value.address?.trim() ? { address: value.address.trim() } : {}),
          ...(value.number?.trim() ? { number: value.number.trim() } : {}),
          ...(value.neighborhood?.trim() ? { neighborhood: value.neighborhood.trim() } : {}),
          ...(value.city?.trim() ? { city: value.city.trim() } : {}),
          ...(value.state?.trim() ? { state: value.state.trim().toUpperCase() } : {}),
          autoRegisterGateway: true,
        };

        const res = await registerMutation.mutateAsync(payload);
        setAccessToken(res.accessToken);
        setSessionUser(res.user);
        await queryClient.invalidateQueries({ queryKey: queryKeys.auth.all() });
        toast.success(`Conta criada com sucesso! Bem-vindo, ${res.user.name.split(' ')[0]}!`);
        navigate('/dashboard', { replace: true });
      } catch (err) {
        if (err instanceof ApiClientError) {
          setErrorMessage(err.message);
        } else {
          setErrorMessage(
            'Não foi possível criar sua conta. Verifique os dados e tente novamente.',
          );
        }
      }
    },
  });

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 p-4 py-8">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">Criar Conta</CardTitle>
          <CardDescription>Cadastre-se na plataforma BaaS LeraPay</CardDescription>
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
            {/* Person Type Selector */}
            <form.AppField name="personType">
              {(field) => (
                <div className="flex flex-col gap-2">
                  <Label>Tipo de Cadastro</Label>
                  <Tabs
                    value={field.state.value}
                    onValueChange={(val) => field.handleChange(val as 'PF' | 'PJ')}
                    className="w-full"
                  >
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="PF" className="flex items-center gap-2">
                        <User className="size-4" />
                        Pessoa Física (PF)
                      </TabsTrigger>
                      <TabsTrigger value="PJ" className="flex items-center gap-2">
                        <Building2 className="size-4" />
                        Pessoa Jurídica (PJ)
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              )}
            </form.AppField>

            {/* Name / Razão Social */}
            <form.AppField
              name="name"
              validators={{
                onChange: ({ value }: { value: string }) =>
                  value.trim().length >= 2 ? undefined : 'Informe seu nome ou razão social',
              }}
            >
              {(field) => {
                const isPJ = form.getFieldValue('personType') === 'PJ';
                return (
                  <div className="flex flex-col gap-2">
                    <Label htmlFor={field.name}>{isPJ ? 'Razão Social' : 'Nome Completo'}</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="text"
                      placeholder={isPJ ? 'Ex: Silva Comércio LTDA' : 'Ex: João da Silva'}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      aria-invalid={
                        field.state.meta.isTouched && field.state.meta.errors.length > 0
                      }
                    />
                    {field.state.meta.isTouched && field.state.meta.errors.length > 0 ? (
                      <p className="text-sm text-destructive">{field.state.meta.errors[0]}</p>
                    ) : null}
                  </div>
                );
              }}
            </form.AppField>

            {/* Trading Name (Only if PJ) */}
            <form.Subscribe selector={(state) => state.values.personType}>
              {(personType) =>
                personType === 'PJ' ? (
                  <form.AppField name="tradingName">
                    {(field) => (
                      <div className="flex flex-col gap-2">
                        <Label htmlFor={field.name}>Nome Fantasia (opcional)</Label>
                        <Input
                          id={field.name}
                          name={field.name}
                          type="text"
                          placeholder="Ex: Silva Store"
                          value={field.state.value || ''}
                          onChange={(e) => field.handleChange(e.target.value)}
                          onBlur={field.handleBlur}
                        />
                      </div>
                    )}
                  </form.AppField>
                ) : null
              }
            </form.Subscribe>

            {/* Document (CPF or CNPJ) and Phone in 2 cols */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <form.AppField
                name="document"
                validators={{
                  onChange: ({ value }: { value: string }) => {
                    const digits = value.replace(/\D/g, '');
                    return digits.length >= 11 ? undefined : 'Documento inválido';
                  },
                }}
              >
                {(field) => {
                  const isPJ = form.getFieldValue('personType') === 'PJ';
                  return (
                    <div className="flex flex-col gap-2">
                      <Label htmlFor={field.name}>{isPJ ? 'CNPJ' : 'CPF'}</Label>
                      <Input
                        id={field.name}
                        name={field.name}
                        type="text"
                        placeholder={isPJ ? '00.000.000/0001-00' : '000.000.000-00'}
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        aria-invalid={
                          field.state.meta.isTouched && field.state.meta.errors.length > 0
                        }
                      />
                      {field.state.meta.isTouched && field.state.meta.errors.length > 0 ? (
                        <p className="text-sm text-destructive">{field.state.meta.errors[0]}</p>
                      ) : null}
                    </div>
                  );
                }}
              </form.AppField>

              <form.AppField
                name="phone"
                validators={{
                  onChange: ({ value }: { value: string }) => {
                    const digits = value.replace(/\D/g, '');
                    return digits.length >= 10 ? undefined : 'Informe telefone com DDD';
                  },
                }}
              >
                {(field) => (
                  <div className="flex flex-col gap-2">
                    <Label htmlFor={field.name}>Telefone / WhatsApp</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="tel"
                      placeholder="(11) 98765-4321"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      aria-invalid={
                        field.state.meta.isTouched && field.state.meta.errors.length > 0
                      }
                    />
                    {field.state.meta.isTouched && field.state.meta.errors.length > 0 ? (
                      <p className="text-sm text-destructive">{field.state.meta.errors[0]}</p>
                    ) : null}
                  </div>
                )}
              </form.AppField>
            </div>

            {/* Email and Password in 2 cols */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <form.AppField
                name="email"
                validators={{
                  onChange: ({ value }: { value: string }) =>
                    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? undefined : 'E-mail inválido',
                }}
              >
                {(field) => (
                  <div className="flex flex-col gap-2">
                    <Label htmlFor={field.name}>E-mail</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="email"
                      autoComplete="email"
                      placeholder="voce@exemplo.com"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      aria-invalid={
                        field.state.meta.isTouched && field.state.meta.errors.length > 0
                      }
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
                    value.length >= 6 ? undefined : 'Mínimo de 6 caracteres',
                }}
              >
                {(field) => (
                  <div className="flex flex-col gap-2">
                    <Label htmlFor={field.name}>Senha</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="password"
                      autoComplete="new-password"
                      placeholder="••••••••"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      aria-invalid={
                        field.state.meta.isTouched && field.state.meta.errors.length > 0
                      }
                    />
                    {field.state.meta.isTouched && field.state.meta.errors.length > 0 ? (
                      <p className="text-sm text-destructive">{field.state.meta.errors[0]}</p>
                    ) : null}
                  </div>
                )}
              </form.AppField>
            </div>

            {/* Collapsible Address Section */}
            <div className="rounded-lg border p-3">
              <button
                type="button"
                className="flex w-full items-center justify-between text-left text-sm font-medium text-muted-foreground hover:text-foreground"
                onClick={() => setShowAddress((prev) => !prev)}
              >
                <span className="flex items-center gap-2">
                  <MapPin className="size-4" />
                  Endereço comercial (opcional)
                </span>
                {showAddress ? (
                  <ChevronUp className="size-4" />
                ) : (
                  <ChevronDown className="size-4" />
                )}
              </button>

              {showAddress ? (
                <div className="mt-4 flex flex-col gap-3">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <form.AppField name="zipCode">
                      {(field) => (
                        <div className="flex flex-col gap-1.5 sm:col-span-1">
                          <Label htmlFor={field.name} className="text-xs">
                            CEP
                          </Label>
                          <Input
                            id={field.name}
                            name={field.name}
                            type="text"
                            placeholder="01001-000"
                            value={field.state.value || ''}
                            onChange={(e) => field.handleChange(e.target.value)}
                            onBlur={field.handleBlur}
                          />
                        </div>
                      )}
                    </form.AppField>

                    <form.AppField name="address">
                      {(field) => (
                        <div className="flex flex-col gap-1.5 sm:col-span-2">
                          <Label htmlFor={field.name} className="text-xs">
                            Logradouro
                          </Label>
                          <Input
                            id={field.name}
                            name={field.name}
                            type="text"
                            placeholder="Rua, Avenida, etc."
                            value={field.state.value || ''}
                            onChange={(e) => field.handleChange(e.target.value)}
                            onBlur={field.handleBlur}
                          />
                        </div>
                      )}
                    </form.AppField>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                    <form.AppField name="number">
                      {(field) => (
                        <div className="flex flex-col gap-1.5 sm:col-span-1">
                          <Label htmlFor={field.name} className="text-xs">
                            Número
                          </Label>
                          <Input
                            id={field.name}
                            name={field.name}
                            type="text"
                            placeholder="123"
                            value={field.state.value || ''}
                            onChange={(e) => field.handleChange(e.target.value)}
                            onBlur={field.handleBlur}
                          />
                        </div>
                      )}
                    </form.AppField>

                    <form.AppField name="neighborhood">
                      {(field) => (
                        <div className="flex flex-col gap-1.5 sm:col-span-1">
                          <Label htmlFor={field.name} className="text-xs">
                            Bairro
                          </Label>
                          <Input
                            id={field.name}
                            name={field.name}
                            type="text"
                            placeholder="Centro"
                            value={field.state.value || ''}
                            onChange={(e) => field.handleChange(e.target.value)}
                            onBlur={field.handleBlur}
                          />
                        </div>
                      )}
                    </form.AppField>

                    <form.AppField name="city">
                      {(field) => (
                        <div className="flex flex-col gap-1.5 sm:col-span-1">
                          <Label htmlFor={field.name} className="text-xs">
                            Cidade
                          </Label>
                          <Input
                            id={field.name}
                            name={field.name}
                            type="text"
                            placeholder="São Paulo"
                            value={field.state.value || ''}
                            onChange={(e) => field.handleChange(e.target.value)}
                            onBlur={field.handleBlur}
                          />
                        </div>
                      )}
                    </form.AppField>

                    <form.AppField name="state">
                      {(field) => (
                        <div className="flex flex-col gap-1.5 sm:col-span-1">
                          <Label htmlFor={field.name} className="text-xs">
                            UF
                          </Label>
                          <Input
                            id={field.name}
                            name={field.name}
                            type="text"
                            maxLength={2}
                            placeholder="SP"
                            value={field.state.value || ''}
                            onChange={(e) => field.handleChange(e.target.value.toUpperCase())}
                            onBlur={field.handleBlur}
                          />
                        </div>
                      )}
                    </form.AppField>
                  </div>
                </div>
              ) : null}
            </div>

            {errorMessage ? (
              <div className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {errorMessage}
              </div>
            ) : null}

            <Button
              type="submit"
              size="lg"
              className="mt-2 w-full"
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Criando conta...
                </>
              ) : (
                'Criar conta'
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Já possui uma conta?{' '}
            <Link
              to="/auth/login"
              className="font-medium text-foreground underline underline-offset-4"
            >
              Entrar
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
