import { fileURLToPath } from 'node:url';
import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

const gatewaySdkSource = fileURLToPath(
  new URL('../../packages/gateway-sdk/src/index.ts', import.meta.url),
);

export default defineConfig({
  plugins: [
    // O Nest e o TypeORM leem `design:*` em tempo de execução; o SWC é usado para
    // preservar os decoradores legados e os metadados que o simples corte de tipos descarta.
    swc.vite({
      module: { type: 'es6' },
      jsc: {
        target: 'es2022',
        parser: { syntax: 'typescript', decorators: true },
        transform: { legacyDecorator: true, decoratorMetadata: true },
      },
    }),
  ],
  resolve: {
    // Apenas nos testes: aponta para o código-fonte do SDK, dispensando o `dist` compilado.
    alias: { '@lerapay/gateway-sdk': gatewaySdkSource },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.spec.ts'],
    clearMocks: true,
    restoreMocks: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: [
        'src/config/env.validation.ts',
        'src/gateway/gateway-auth.error.ts',
        'src/gateway/gateway.service.ts',
        'src/payments/payments.service.ts',
        'src/webhooks/webhooks.service.ts',
      ],
    },
  },
});
