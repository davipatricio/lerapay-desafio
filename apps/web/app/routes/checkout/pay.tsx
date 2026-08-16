import { useState, useEffect } from 'react';
import { useParams } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  QrCode,
  CreditCard,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  Landmark,
  Lock,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useCheckoutLinkDetailQuery,
  useFeesQuery,
  usePublicCheckoutPaymentQuery,
} from '../../lib/queries';
import { useCreatePixPaymentMutation, useCreateCardPaymentMutation } from '../../lib/mutations';
import type { FeeDto } from '../../lib/api/types';
import { formatBRL } from '../../lib/money';
import type { Route } from './+types/pay';

export function meta(_: Route.MetaArgs) {
  return [
    { title: 'Checkout Seguro | LeraPay' },
    { name: 'description', content: 'Pagamento seguro processado via LeraPay e Lera Box Gateway' },
  ];
}

// Helpers for input masks
function formatDocument(val: string): string {
  const digits = val.replace(/\D/g, '').slice(0, 14);
  if (digits.length <= 11) {
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }
  return digits
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

function formatCardNumber(val: string): string {
  const digits = val.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
}

function detectBrand(number: string): 'VISA' | 'MASTERCARD' | 'ELO' {
  const clean = number.replace(/\D/g, '');
  if (clean.startsWith('4')) return 'VISA';
  if (/^(5[1-5]|2[2-7])/.test(clean)) return 'MASTERCARD';
  if (/^(4011|4389|4514|5041|5066|5090|6277|6362|6363|650|6516|6550)/.test(clean)) return 'ELO';
  return 'VISA';
}

export default function CheckoutPaymentPage(_props: Route.ComponentProps) {
  const { id } = useParams<{ id: string }>();
  const linkId = id || '';

  const {
    data: link,
    isLoading: isLinkLoading,
    error: linkError,
  } = useCheckoutLinkDetailQuery(linkId);
  const { data: feesData = [] } = useFeesQuery();
  const fees: FeeDto[] = Array.isArray(feesData)
    ? (feesData as FeeDto[])
    : (feesData as any)?.fees && Array.isArray((feesData as any).fees)
      ? (feesData as any).fees
      : [];

  const pixMutation = useCreatePixPaymentMutation();
  const cardMutation = useCreateCardPaymentMutation();

  // Active Payment Method Tab
  const [method, setMethod] = useState<'PIX' | 'CREDIT_CARD'>('PIX');

  // Pix state
  const [payerDocument, setPayerDocument] = useState('');
  const [pixData, setPixData] = useState<{
    orderId?: string;
    qrCodeBase64?: string;
    qrCode?: string;
    expiresAt?: string;
  } | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Polling order status if Pix order was generated
  const activeOrderId = pixData?.orderId || '';
  const { data: polledOrder } = usePublicCheckoutPaymentQuery(linkId, activeOrderId, {
    requestOptions: {
      // react-query refetch interval will poll every 3s if status is PENDING
    },
  });

  // Credit Card state
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [expiryMonth, setExpiryMonth] = useState('');
  const [expiryYear, setExpiryYear] = useState('');
  const [cvv, setCvv] = useState('');
  const [brand, setBrand] = useState<'VISA' | 'MASTERCARD' | 'ELO'>('VISA');
  const [selectedInstallments, setSelectedInstallments] = useState(1);

  // Success screen state
  const [paymentSuccess, setPaymentSuccess] = useState<{
    method: 'PIX' | 'CREDIT_CARD';
    amount: number;
    reference: string;
  } | null>(null);

  // Set default active tab based on allowed methods
  useEffect(() => {
    if (link?.allowedMethods) {
      if (!link.allowedMethods.includes('PIX') && link.allowedMethods.includes('CREDIT_CARD')) {
        setMethod('CREDIT_CARD');
      }
    }
  }, [link]);

  // Check if polled Pix order became approved
  useEffect(() => {
    if (
      polledOrder &&
      (polledOrder.status === 'APPROVED' || (polledOrder as any).status === 'COMPLETED')
    ) {
      setPaymentSuccess({
        method: 'PIX',
        amount: polledOrder.amount,
        reference: polledOrder.externalReference,
      });
      toast.success('Pagamento Pix confirmado com sucesso!');
    }
  }, [polledOrder]);

  const handleCopyPix = async () => {
    if (pixData?.qrCode) {
      await navigator.clipboard.writeText(pixData.qrCode);
      setIsCopied(true);
      toast.success('Código Pix Copia e Cola copiado!');
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleGeneratePix = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!link) return;

    const cleanDoc = payerDocument.replace(/\D/g, '');
    if (cleanDoc.length !== 11 && cleanDoc.length !== 14) {
      toast.error('Informe um CPF (11 dígitos) ou CNPJ (14 dígitos) válido');
      return;
    }

    try {
      const res = await pixMutation.mutateAsync({
        amount: link.amount,
        payerDocument: cleanDoc,
        checkoutLinkId: link.id,
        description: link.title,
        externalReference: link.externalReference,
      });

      setPixData({
        orderId: res.orderId || res.id,
        qrCodeBase64: res.qrCodeBase64,
        qrCode: res.qrCode,
        expiresAt: res.expiresAt,
      });

      toast.success('QR Code Pix gerado com sucesso!');
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao gerar Pix');
    }
  };

  const handleCardNumberChange = (val: string) => {
    setCardNumber(formatCardNumber(val));
    const detected = detectBrand(val);
    setBrand(detected);
  };

  const handlePayCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!link) return;

    const cleanCard = cardNumber.replace(/\D/g, '');
    if (cleanCard.length < 13 || cleanCard.length > 19) {
      toast.error('Número de cartão inválido');
      return;
    }

    if (!cardHolder.trim()) {
      toast.error('Informe o nome impresso no cartão');
      return;
    }

    if (!expiryMonth || !expiryYear) {
      toast.error('Informe o mês e ano de validade');
      return;
    }

    if (!cvv || cvv.length < 3) {
      toast.error('Informe o código de segurança (CVV)');
      return;
    }

    // Find fee percentage for brand + installments
    const matchingFee = fees.find(
      (f) =>
        f.brand.toUpperCase() === brand.toUpperCase() &&
        Number(f.installments) === Number(selectedInstallments),
    );

    const feePercent = matchingFee ? Number(matchingFee.feePercent) : 0;

    try {
      const res = await cardMutation.mutateAsync({
        amount: link.amount,
        cardNumber: cleanCard,
        cardHolder: cardHolder.trim().toUpperCase(),
        expiryMonth: expiryMonth.padStart(2, '0'),
        expiryYear: expiryYear.length === 2 ? `20${expiryYear}` : expiryYear,
        cvv: cvv.trim(),
        brand,
        installments: selectedInstallments,
        feePercent,
        checkoutLinkId: link.id,
        description: link.title,
        externalReference: link.externalReference,
      });

      if (res.status === 'APPROVED' || res.success) {
        setPaymentSuccess({
          method: 'CREDIT_CARD',
          amount: link.amount,
          reference: res.externalReference,
        });
        toast.success('Pagamento no cartão aprovado com sucesso!');
      } else {
        toast.error(`Pagamento não aprovado: status ${res.status}`);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao processar cartão de crédito');
    }
  };

  if (isLinkLoading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg p-6 space-y-4">
          <Skeleton className="h-6 w-48 mx-auto" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-40 w-full" />
        </Card>
      </div>
    );
  }

  if (linkError || !link) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center p-8">
          <AlertCircle className="size-12 text-destructive mx-auto mb-3" />
          <CardTitle className="text-xl">Link não encontrado</CardTitle>
          <CardDescription className="mt-2">
            Este link de pagamento pode ter sido removido ou o identificador é inválido.
          </CardDescription>
        </Card>
      </div>
    );
  }

  const isExpired = link.expiresAt && new Date(link.expiresAt) < new Date();
  if (link.status === 'COMPLETED' || isExpired) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center p-8">
          <Clock className="size-12 text-muted-foreground mx-auto mb-3" />
          <CardTitle className="text-xl">
            {link.status === 'COMPLETED' ? 'Pagamento já Realizado' : 'Link de Checkout Expirado'}
          </CardTitle>
          <CardDescription className="mt-2">
            {link.status === 'COMPLETED'
              ? 'Este link de pagamento já foi concluído e não aceita mais pagamentos.'
              : 'O prazo de validade deste link de pagamento foi encerrado.'}
          </CardDescription>
        </Card>
      </div>
    );
  }

  // Payment Confirmation / Success Screen
  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 text-center border-emerald-500/30">
          <div className="size-16 bg-emerald-500/10 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="size-10" />
          </div>
          <CardTitle className="text-2xl font-bold text-emerald-600">
            Pagamento Confirmado!
          </CardTitle>
          <CardDescription className="mt-1">
            Seu pagamento foi processado e confirmado com sucesso.
          </CardDescription>

          <div className="my-6 rounded-lg border bg-muted/40 p-4 text-left space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Item:</span>
              <span className="font-medium">{link.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Valor pago:</span>
              <span className="font-bold text-base">{formatBRL(paymentSuccess.amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Forma de pagamento:</span>
              <span>
                {paymentSuccess.method === 'PIX' ? 'Pix Instantâneo' : 'Cartão de Crédito'}
              </span>
            </div>
            <div className="flex justify-between font-mono text-xs">
              <span className="text-muted-foreground">Referência:</span>
              <span>{paymentSuccess.reference}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Button variant="outline" onClick={() => window.print()} className="w-full">
              Imprimir Comprovante
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Calculate installment preview options
  const maxInst = link.maxInstallments || 12;
  const brandFees = fees.filter((f) => f.brand.toUpperCase() === brand.toUpperCase());

  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4 flex flex-col items-center justify-center">
      <div className="w-full max-w-lg space-y-6">
        {/* Header Branding */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Landmark className="size-4" />
            </div>
            <div>
              <p className="text-sm font-semibold">LeraPay Checkout</p>
              <p className="text-[11px] text-muted-foreground">Ambiente Seguro Lera Box</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Lock className="size-3.5 text-emerald-600" />
            <span>256-bit SSL</span>
          </div>
        </div>

        {/* Order Summary Card */}
        <Card className="border shadow-sm">
          <CardHeader className="bg-muted/40 pb-4">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg font-bold">{link.title}</CardTitle>
                <CardDescription className="text-xs font-mono mt-1">
                  Ref: {link.externalReference}
                </CardDescription>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary">{formatBRL(link.amount)}</p>
                <p className="text-[11px] text-muted-foreground">Total à pagar</p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            {/* Method Tabs */}
            <div className="grid grid-cols-2 gap-2 mb-6">
              {link.allowedMethods.includes('PIX') && (
                <button
                  type="button"
                  onClick={() => setMethod('PIX')}
                  className={`flex items-center justify-center gap-2 rounded-lg border py-3 px-4 text-sm font-medium transition-all ${
                    method === 'PIX'
                      ? 'border-primary bg-primary text-primary-foreground shadow-xs'
                      : 'border-border bg-background hover:bg-muted text-foreground'
                  }`}
                >
                  <QrCode className="size-4" />
                  <span>Pix Instantâneo</span>
                </button>
              )}

              {link.allowedMethods.includes('CREDIT_CARD') && (
                <button
                  type="button"
                  onClick={() => setMethod('CREDIT_CARD')}
                  className={`flex items-center justify-center gap-2 rounded-lg border py-3 px-4 text-sm font-medium transition-all ${
                    method === 'CREDIT_CARD'
                      ? 'border-primary bg-primary text-primary-foreground shadow-xs'
                      : 'border-border bg-background hover:bg-muted text-foreground'
                  }`}
                >
                  <CreditCard className="size-4" />
                  <span>Cartão de Crédito</span>
                </button>
              )}
            </div>

            {/* Pix Flow */}
            {method === 'PIX' && (
              <div className="space-y-4">
                {!pixData ? (
                  <form onSubmit={handleGeneratePix} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="payerDoc">Seu CPF ou CNPJ *</Label>
                      <Input
                        id="payerDoc"
                        placeholder="000.000.000-00"
                        value={payerDocument}
                        onChange={(e) => setPayerDocument(formatDocument(e.target.value))}
                        required
                      />
                      <p className="text-[11px] text-muted-foreground">
                        Necessário para registro da transação Pix no Banco Central
                      </p>
                    </div>

                    <Button
                      type="submit"
                      className="w-full gap-2 text-base py-5"
                      disabled={pixMutation.isPending}
                    >
                      <QrCode className="size-4" />
                      <span>
                        {pixMutation.isPending ? 'Gerando QR Code...' : 'Gerar QR Code Pix'}
                      </span>
                    </Button>
                  </form>
                ) : (
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="p-3 bg-white rounded-xl border shadow-xs">
                      {pixData.qrCodeBase64 ? (
                        <img
                          src={
                            pixData.qrCodeBase64.startsWith('data:image')
                              ? pixData.qrCodeBase64
                              : `data:image/png;base64,${pixData.qrCodeBase64}`
                          }
                          alt="QR Code Pix"
                          className="size-52 object-contain"
                        />
                      ) : (
                        <div className="size-52 flex items-center justify-center bg-muted text-muted-foreground text-xs">
                          QR Code gerado
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <p className="text-sm font-semibold">
                        Abra o app do seu banco e escaneie o código
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Ou utilize a opção <strong>Pix Copia e Cola</strong> abaixo
                      </p>
                    </div>

                    {pixData.qrCode && (
                      <div className="w-full space-y-2">
                        <div className="relative">
                          <Input
                            readOnly
                            value={pixData.qrCode}
                            className="font-mono text-xs pr-10 bg-muted/50"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleCopyPix}
                          className="w-full gap-2"
                        >
                          {isCopied ? (
                            <>
                              <Check className="size-4 text-emerald-600" />
                              <span className="text-emerald-600">Código Copiado!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="size-4" />
                              <span>Copiar Código Pix</span>
                            </>
                          )}
                        </Button>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-xs text-muted-foreground bg-amber-500/10 text-amber-700 dark:text-amber-400 p-2.5 rounded-md border border-amber-500/20">
                      <Clock className="size-4 shrink-0 animate-pulse" />
                      <span>Aguardando confirmação do pagamento pelo gateway...</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Credit Card Flow */}
            {method === 'CREDIT_CARD' && (
              <form onSubmit={handlePayCard} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="cardNumber">Número do Cartão *</Label>
                  <div className="relative">
                    <Input
                      id="cardNumber"
                      placeholder="0000 0000 0000 0000"
                      value={cardNumber}
                      onChange={(e) => handleCardNumberChange(e.target.value)}
                      maxLength={19}
                      required
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Badge variant="secondary" className="text-[10px] font-mono">
                        {brand}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="cardHolder">Nome Impresso no Cartão *</Label>
                  <Input
                    id="cardHolder"
                    placeholder="JOAO DA SILVA"
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="expiryMonth">Mês (MM) *</Label>
                    <Input
                      id="expiryMonth"
                      placeholder="12"
                      maxLength={2}
                      value={expiryMonth}
                      onChange={(e) => setExpiryMonth(e.target.value.replace(/\D/g, ''))}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="expiryYear">Ano (AAAA) *</Label>
                    <Input
                      id="expiryYear"
                      placeholder="2028"
                      maxLength={4}
                      value={expiryYear}
                      onChange={(e) => setExpiryYear(e.target.value.replace(/\D/g, ''))}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="cvv">CVV *</Label>
                    <Input
                      id="cvv"
                      placeholder="123"
                      maxLength={4}
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="installments">Opções de Parcelamento *</Label>
                  <select
                    id="installments"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    value={selectedInstallments}
                    onChange={(e) => setSelectedInstallments(Number(e.target.value))}
                  >
                    {Array.from({ length: maxInst }, (_, i) => i + 1).map((num) => {
                      const feeItem = brandFees.find((f) => Number(f.installments) === num);
                      const feePct = feeItem ? Number(feeItem.feePercent) : 0;
                      const totalWithFee = Math.round(link.amount * (1 + feePct / 100));
                      const perInstallment = Math.round(totalWithFee / num);

                      return (
                        <option key={num} value={num}>
                          {num}x de {formatBRL(perInstallment)}{' '}
                          {num === 1
                            ? `(Total ${formatBRL(totalWithFee)})`
                            : `(Taxa ${feePct.toFixed(2)}% · Total ${formatBRL(totalWithFee)})`}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <Button
                  type="submit"
                  className="w-full gap-2 text-base py-5 mt-2"
                  disabled={cardMutation.isPending}
                >
                  <ShieldCheck className="size-4" />
                  <span>
                    {cardMutation.isPending
                      ? 'Processando Pagamento...'
                      : `Pagar ${formatBRL(link.amount)}`}
                  </span>
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Security badge footer */}
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground text-center">
          <ShieldCheck className="size-4 text-emerald-600" />
          <span>Pagamento processado em conformidade com o Banco Central do Brasil e PCI-DSS</span>
        </div>
      </div>
    </div>
  );
}
