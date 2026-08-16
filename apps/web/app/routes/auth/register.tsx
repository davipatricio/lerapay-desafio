import { useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { toast } from 'sonner';
import { useAppForm } from '../../lib/forms';
import { useRegisterMutation } from '../../lib/mutations/auth';
import { queryKeys } from '../../lib/query/keys';
import { setAccessToken, setSessionUser } from '../../lib/auth/token';
import { ApiClientError } from '../../lib/api/errors';
import { CepLookupError, lookupCep } from '../../lib/cep';
import { formatCep, formatPhone, formatDocument, stripNonDigits } from '../../lib/formatters';
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
  document: z.string().refine((val) => {
    const digits = stripNonDigits(val);
    return digits.length === 11 || digits.length === 14;
  }, 'Informe um CPF (11 dígitos) ou CNPJ (14 dígitos) válido'),
  phone: z.string().refine((val) => {
    const digits = stripNonDigits(val);
    return digits.length >= 10 && digits.length <= 11;
  }, 'Informe um telefone com DDD válido'),
  password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
  tradingName: z.string().optional(),
  zipCode: z.string().refine((val) => {
    return stripNonDigits(val).length === 8;
  }, 'Informe um CEP válido com 8 dígitos'),
  address: z.string().trim().min(1, 'Informe o logradouro'),
  number: z.string().trim().min(1, 'Informe o número'),
  neighborhood: z.string().trim().min(1, 'Informe o bairro'),
  city: z.string().trim().min(1, 'Informe a cidade'),
  state: z.string().regex(/^[A-Za-z]{2}$/, 'Informe a UF com 2 letras'),
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function Register() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showAddress, setShowAddress] = useState(true);
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);
  const cepRequest = useRef<AbortController | null>(null);

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
        const cleanedDoc = stripNonDigits(value.document);
        const cleanedPhone = stripNonDigits(value.phone);
        const cleanedZip = stripNonDigits(value.zipCode);

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
          zipCode: cleanedZip,
          address: value.address.trim(),
          number: value.number.trim(),
          neighborhood: value.neighborhood.trim(),
          city: value.city.trim(),
          state: value.state.trim().toUpperCase(),
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

  const handleCepLookup = async (cep: string) => {
    cepRequest.current?.abort();
    const controller = new AbortController();
    cepRequest.current = controller;
    setCepError(null);

    const digits = stripNonDigits(cep);
    if (digits.length !== 8) {
      setCepLoading(false);
      return;
    }

    setCepLoading(true);
    try {
      const address = await lookupCep(digits, controller.signal);
      form.setFieldValue('address', address.address);
      form.setFieldValue('neighborhood', address.neighborhood);
      form.setFieldValue('city', address.city);
      form.setFieldValue('state', address.state);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setCepError(
        error instanceof CepLookupError
          ? error.message
          : 'Não foi possível consultar o CEP agora. Você pode preencher o endereço manualmente.',
      );
    } finally {
      if (cepRequest.current === controller) {
        setCepLoading(false);
      }
    }
  };

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
                    onValueChange={(val) => {
                      const nextType = val as 'PF' | 'PJ';
                      field.handleChange(nextType);
                      const currentDoc = form.getFieldValue('document');
                      if (currentDoc) {
                        form.setFieldValue('document', formatDocument(currentDoc, nextType));
                      }
                    }}
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
                    const digits = stripNonDigits(value);
                    const isPJ = form.getFieldValue('personType') === 'PJ';
                    if (isPJ) {
                      return digits.length === 14 ? undefined : 'CNPJ deve conter 14 dígitos';
                    }
                    return digits.length === 11 ? undefined : 'CPF deve conter 11 dígitos';
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
                        inputMode="numeric"
                        maxLength={isPJ ? 18 : 14}
                        placeholder={isPJ ? '00.000.000/0001-00' : '000.000.000-00'}
                        value={field.state.value}
                        onChange={(e) => {
                          const formatted = formatDocument(e.target.value, isPJ ? 'PJ' : 'PF');
                          field.handleChange(formatted);
                        }}
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
                    const digits = stripNonDigits(value);
                    return digits.length >= 10 && digits.length <= 11
                      ? undefined
                      : 'Informe telefone com DDD (10 ou 11 dígitos)';
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
                      inputMode="numeric"
                      maxLength={15}
                      placeholder="(11) 98765-4321"
                      value={field.state.value}
                      onChange={(e) => {
                        const formatted = formatPhone(e.target.value);
                        field.handleChange(formatted);
                      }}
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

            {/* Required commercial address with ViaCEP autofill */}
            <div className="rounded-lg border p-3">
              <button
                type="button"
                className="flex w-full items-center justify-between text-left text-sm font-medium text-muted-foreground hover:text-foreground"
                onClick={() => setShowAddress((prev) => !prev)}
              >
                <span className="flex items-center gap-2">
                  <MapPin className="size-4" />
                  Endereço comercial (obrigatório)
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
                    <form.AppField
                      name="zipCode"
                      validators={{
                        onChange: ({ value }: { value: string }) => {
                          const digits = stripNonDigits(value);
                          return digits.length === 8 ? undefined : 'CEP deve conter 8 dígitos';
                        },
                      }}
                    >
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
                            autoComplete="postal-code"
                            inputMode="numeric"
                            maxLength={9}
                            required
                            value={field.state.value || ''}
                            onChange={(e) => {
                              cepRequest.current?.abort();
                              const formatted = formatCep(e.target.value);
                              field.handleChange(formatted);
                              setCepLoading(false);
                              setCepError(null);
                              const digits = stripNonDigits(formatted);
                              if (digits.length === 8) {
                                void handleCepLookup(digits);
                              }
                            }}
                            onBlur={(e) => {
                              field.handleBlur();
                              void handleCepLookup(e.target.value);
                            }}
                            aria-invalid={
                              field.state.meta.isTouched && field.state.meta.errors.length > 0
                            }
                          />
                          {cepLoading ? (
                            <p className="text-xs text-muted-foreground">Consultando CEP...</p>
                          ) : null}
                          {cepError ? <p className="text-xs text-destructive">{cepError}</p> : null}
                          {field.state.meta.isTouched && field.state.meta.errors.length > 0 ? (
                            <p className="text-xs text-destructive">{field.state.meta.errors[0]}</p>
                          ) : null}
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
                            autoComplete="street-address"
                            required
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
                            autoComplete="address-line2"
                            required
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
                            autoComplete="address-level3"
                            required
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
                            autoComplete="address-level2"
                            required
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
                            autoComplete="address-level1"
                            required
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
