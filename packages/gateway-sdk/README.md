# @lerapay/gateway-sdk

SDK TypeScript para a gateway Lera Box / BranchPay Sandbox. Fornece uma API clean para processamento de pagamentos, gestão de webhooks e operações de usuário.

---

## Stack

- **TypeScript 7.0.2** (`catalog:frontend`)
- **HTTP Client**: `ofetch` — chamadas REST tipadas
- **Bundler**: `tsdown` — bundle ESM + declarações TypeScript
- **Lint/Format**: `oxlint` + `oxfmt` (padrão monorepo)

---

## Convenções-chave

- **API Exportada**: `BranchPayClient` para interações, `verifyWebhookSignature` para validação, interfaces tipadas para todos os payloads
- **Segurança de tipos**: Todas as respostas da API são tipadas; use as interfaces exportadas para requests/responses
- **Tratamento de erros**: Classe `BranchPayError` para erros específicos da gateway
- **ESM-only**: Sintaxe `import` em todos os arquivos
- **Output de build**: `dist/` contém bundle ESM e declarações TypeScript

---

## Estrutura do projeto

```
packages/gateway-sdk/
├── package.json            # Manifest ESM
├── tsconfig.json           # Config TypeScript estrito
├── tsdown.config.ts        # Configuração do bundler
├── src/
│   ├── index.ts            # Exportações da API pública
│   ├── client.ts           # Implementação do BranchPayClient
│   ├── types.ts            # Interfaces DTO
│   ├── errors.ts           # Tratamento de erros
│   └── utils.ts            # verifyWebhookSignature
└── dist/                   # Output do build (gitignorado)
```

---

## ✅ Recursos

- Processamento de pagamentos tipados (card, PIX)
- Criação, listagem e gestão de webhooks
- Rastreamento de wallet e transações
- Autenticação de usuário (criar, login, reset de senha)
- Tabela de taxas (fees)

---

## 🛠️ Comandos disponíveis

| Script      | Comando          | Finalidade                                |
| ----------- | ---------------- | ----------------------------------------- |
| `build`     | `tsdown`         | Compilar bundle ESM + declarações `.d.ts` |
| `typecheck` | `tsc --noEmit`   | Verificação de tipos (sem gerar arquivos) |
| `lint`      | `oxlint .`       | Lint com oxlint                           |
| `format`    | `oxfmt .`        | Formatação com oxfmt                      |
| `lint:fix`  | `oxlint . --fix` | Auto-fix de problemas de lint             |

---

## 📦 Uso minimal

```ts
import { BranchPayClient } from '@lerapay/gateway-sdk';

const client = new BranchPayClient({
  baseUrl: 'https://api.branchpay.com.br/api',
  token: 'sua-chave-de-acesso',
});

// Exemplo simples: criar pagamento PIX
const payment = await client.createPixPayment({
  amount: 1000,
  currency: 'BRL',
  // ... outros campos do DTO
});

console.log('Payment created:', payment);
```

---
