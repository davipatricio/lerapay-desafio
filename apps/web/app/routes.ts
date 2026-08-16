import type { RouteConfig } from '@react-router/dev/routes';
import { index, layout, route } from '@react-router/dev/routes';

export default [
  index('routes/home.tsx'),
  route('auth/login', 'routes/auth/login.tsx'),
  route('auth/register', 'routes/auth/register.tsx'),
  route('checkout/:id', 'routes/checkout/pay.tsx'),
  layout('routes/app-shell.tsx', [
    route('dashboard', 'routes/dashboard/index.tsx'),
    route('dashboard/checkout', 'routes/dashboard/checkout.tsx'),
    route('dashboard/fees', 'routes/dashboard/fees.tsx'),
    route('dashboard/wallet', 'routes/dashboard/wallet.tsx'),
    route('dashboard/transactions', 'routes/dashboard/transactions.tsx'),
    route('dashboard/withdrawals', 'routes/dashboard/withdrawals.tsx'),
    route('dashboard/webhooks', 'routes/dashboard/webhooks.tsx'),
  ]),
] satisfies RouteConfig;
