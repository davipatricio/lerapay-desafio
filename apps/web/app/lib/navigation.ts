import {
  LayoutDashboard,
  Percent,
  Wallet,
  Receipt,
  Link2,
  ArrowDownToLine,
  Webhook,
  type LucideIcon,
} from 'lucide-react';

/**
 * Single source of truth for the dashboard navigation. Used by the app shell
 * (sidebar menu + breadcrumbs) so route metadata never drifts between the two.
 */
export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

export const navItems: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/dashboard/fees', label: 'Tarifas', icon: Percent },
  { to: '/dashboard/checkout', label: 'Links de Checkout', icon: Link2 },
  { to: '/dashboard/wallet', label: 'Carteira', icon: Wallet },
  { to: '/dashboard/transactions', label: 'Transações', icon: Receipt },
  { to: '/dashboard/withdrawals', label: 'Saques', icon: ArrowDownToLine },
  { to: '/dashboard/webhooks', label: 'Webhooks', icon: Webhook },
];

/**
 * Resolve the nav item matching a pathname. `/dashboard` is exact-match only
 * (its siblings share the prefix but are distinct destinations).
 */
export function findActiveNav(pathname: string): NavItem | undefined {
  return navItems.find(
    (item) => pathname === item.to || (item.to !== '/dashboard' && pathname.startsWith(item.to)),
  );
}
