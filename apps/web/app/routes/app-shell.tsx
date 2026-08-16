import { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getAccessToken,
  getSessionUser,
  clearSession,
} from '../lib/auth/token';
import { isLocalSessionExpiredError } from '../lib/api/errors';
import { queryKeys } from '../lib/query/keys';
import { useMeQuery } from '../lib/queries';
import { navItems, findActiveNav } from '../lib/navigation';
import { useGlobalShortcuts } from '../lib/shortcuts';
import { ThemeToggle } from '../components/theme-toggle';
import { ErrorBoundary } from '../components/dashboard/error-boundary';
import { PageSkeleton } from '../components/dashboard/page-skeleton';

// Secondary, on-demand surfaces are code-split so their JS isn't in the shell
// critical path. They mount lazily when the user actually opens them.
const LinkGatewayModal = lazy(() =>
  import('../components/link-gateway-modal').then((m) => ({ default: m.LinkGatewayModal })),
);
const CommandPalette = lazy(() =>
  import('../components/command-palette').then((m) => ({ default: m.CommandPalette })),
);
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Landmark, ShieldAlert, ShieldCheck, LogOut, ChevronsUpDown, Search } from 'lucide-react';
import { Kbd } from '@/components/ui/kbd';
import { Button } from '@/components/ui/button';
import type { Route } from './+types/app-shell';

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform ?? '');
const modKey = isMac ? '⌘' : 'Ctrl';

function Brand() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size="lg" render={<Link to="/dashboard" />} className="gap-2">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Landmark className="size-4" />
          </div>
          {!collapsed && (
            <div className="min-w-0 leading-tight">
              <p className="truncate text-sm font-semibold">LeraPay</p>
              <p className="truncate text-[11px] text-muted-foreground">BaaS · Loja</p>
            </div>
          )}
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

export function meta(_: Route.MetaArgs) {
  return [{ title: 'Dashboard | LeraPay' }];
}

export default function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [linkOpen, setLinkOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [gatewayPending, setGatewayPending] = useState(false);
  const sessionUser = getSessionUser();

  const openPalette = useCallback(() => setPaletteOpen(true), []);
  const handleShortcutNavigate = useCallback((path: string) => navigate(path), [navigate]);
  useGlobalShortcuts({ onNavigate: handleShortcutNavigate, onOpenPalette: openPalette });

  const { data: meUser, error: meError } = useMeQuery();
  const user = meUser || sessionUser;

  useEffect(() => {
    if (isLocalSessionExpiredError(meError)) {
      clearSession();
      queryClient.clear();
      navigate('/auth/login', { replace: true });
    }
  }, [meError, navigate, queryClient]);

  useEffect(() => {
    const handleGatewayPending = () => setGatewayPending(true);
    const handleGatewayLinked = () => setGatewayPending(false);
    window.addEventListener('lerapay:gateway-pending', handleGatewayPending);
    window.addEventListener('lerapay:gateway-linked', handleGatewayLinked);
    return () => {
      window.removeEventListener('lerapay:gateway-pending', handleGatewayPending);
      window.removeEventListener('lerapay:gateway-linked', handleGatewayLinked);
    };
  }, []);

  // Check if gateway token is expired
  const gatewayAccount = user?.gatewayAccount;
  const isGatewayTokenExpired =
    gatewayPending ||
    Boolean(
      gatewayAccount?.isLinked &&
        gatewayAccount?.tokenExpiresAt &&
        new Date(gatewayAccount.tokenExpiresAt) < new Date(),
    );

  // Client-side auth guard: the JWT lives in localStorage (not a cookie), so SSR
  // cannot see it. On the client, redirect to /auth/login when there is no token.
  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      setAuthed(false);
      navigate('/auth/login', { replace: true });
    } else {
      setAuthed(true);
    }
  }, [navigate, location.pathname]);

  if (!authed) {
    return null;
  }

  const handleLogout = async () => {
    setAuthed(false);
    clearSession();
    navigate('/auth/login', { replace: true });
    await queryClient.cancelQueries();
    queryClient.clear();
    toast.success('Sessão encerrada');
  };

  const isGatewayLinked = Boolean(user?.gatewayAccount?.isLinked) && !gatewayPending;
  const activeNav = findActiveNav(location.pathname);

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'LO';

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <Brand />
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Menu</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => {
                  const active =
                    location.pathname === item.to ||
                    (item.to !== '/dashboard' && location.pathname.startsWith(item.to));
                  const Icon = item.icon;
                  return (
                    <SidebarMenuItem key={item.to}>
                      <SidebarMenuButton
                        render={<Link to={item.to} />}
                        isActive={active}
                        tooltip={item.label}
                        className={active ? 'bg-sidebar-accent' : ''}
                      >
                        <Icon />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <SidebarMenuButton
                      size="lg"
                      className="data-popup-open:bg-sidebar-accent data-popup-open:text-sidebar-accent-foreground"
                    >
                      <Avatar className="size-8">
                        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                      </Avatar>
                      <div className="grid flex-1 overflow-hidden text-left leading-tight">
                        <span className="truncate font-semibold">
                          {user?.name?.split(' ')[0] ?? 'Lojista'}
                        </span>
                        {isGatewayTokenExpired ? (
                          <span className="flex items-center gap-1 truncate text-xs font-medium text-warning">
                            <ShieldAlert className="size-3" /> Sessão Expirada
                          </span>
                        ) : !isGatewayLinked ? (
                          <span className="flex items-center gap-1 truncate text-xs font-medium text-warning">
                            <ShieldAlert className="size-3" /> Vincular Gateway
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 truncate text-xs font-medium text-success">
                            <ShieldCheck className="size-3" /> Conectado
                          </span>
                        )}
                      </div>
                      <ChevronsUpDown className="ml-auto size-4" />
                    </SidebarMenuButton>
                  }
                />
                <DropdownMenuContent side="top" align="end" sideOffset={8} className="w-56">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="py-2">
                      <p className="text-sm font-medium text-foreground">{user?.name}</p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                    </DropdownMenuLabel>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    {isGatewayTokenExpired && (
                      <>
                        <DropdownMenuItem onClick={() => setLinkOpen(true)} className="text-warning">
                          <ShieldAlert className="text-warning" />
                          Re-autenticar Gateway
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    {!isGatewayLinked && !isGatewayTokenExpired && (
                      <>
                        <DropdownMenuItem onClick={() => setLinkOpen(true)}>
                          <ShieldAlert className="text-warning" />
                          Vincular Gateway
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={handleLogout}
                      className="font-semibold text-red-600 hover:bg-red-600 hover:text-white focus:bg-red-600 focus:text-white dark:text-red-400 dark:hover:bg-red-500 dark:hover:text-white dark:focus:bg-red-500 dark:focus:text-white"
                    >
                      <LogOut className="text-red-600 group-hover/dropdown-menu-item:text-white group-focus/dropdown-menu-item:text-white dark:text-red-400 dark:group-hover/dropdown-menu-item:text-white dark:group-focus/dropdown-menu-item:text-white" />
                      Sair
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-3 border-b px-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-5" />
          <Breadcrumb className="min-w-0">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink render={<Link to="/dashboard" />}>Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              {activeNav && activeNav.to !== '/dashboard' && (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{activeNav.label}</BreadcrumbPage>
                  </BreadcrumbItem>
                </>
              )}
            </BreadcrumbList>
          </Breadcrumb>

          <div className="ml-auto flex shrink-0 items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPaletteOpen(true)}
              className="h-8 w-auto justify-between gap-3 border-input bg-muted/30 px-2.5 text-xs text-muted-foreground shadow-none hover:bg-muted hover:text-foreground sm:w-48"
              aria-label="Buscar páginas e ações"
            >
              <span className="flex items-center gap-2">
                <Search className="size-3.5" />
                <span className="hidden sm:inline">Buscar...</span>
              </span>
              <Kbd className="ml-auto hidden sm:inline-flex">{modKey} K</Kbd>
            </Button>
            <ThemeToggle />
          </div>
        </header>

        <main className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
          <ErrorBoundary onReset={() => queryClient.resetQueries({ queryKey: queryKeys.all })}>
            <Suspense fallback={<PageSkeleton />}>
              <Outlet />
            </Suspense>
          </ErrorBoundary>
        </main>
      </SidebarInset>

      {linkOpen ? (
        <Suspense fallback={null}>
          <LinkGatewayModal user={user} open onOpenChange={setLinkOpen} />
        </Suspense>
      ) : null}
      {paletteOpen ? (
        <Suspense fallback={null}>
          <CommandPalette open onOpenChange={setPaletteOpen} />
        </Suspense>
      ) : null}
    </SidebarProvider>
  );
}
