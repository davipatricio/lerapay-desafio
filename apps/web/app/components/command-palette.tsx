'use client';

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { useTheme } from 'next-themes';
import { Search, CornerDownLeft, Plus, SunMoon, type LucideIcon } from 'lucide-react';

import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Kbd, KbdGroup } from '@/components/ui/kbd';
import { navItems } from '@/lib/navigation';
import { GOTO_KEYS } from '@/lib/shortcuts';
import { cn } from '@/lib/utils';

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: LucideIcon;
  shortcut?: string;
  onSelect: () => void;
}

/** Reverse lookup: GOTO_KEYS is `letter → path`, here we want `path → letter`. */
const gotoLetterFor = (path: string): string | undefined =>
  Object.entries(GOTO_KEYS).find(([, to]) => to === path)?.[0];

export interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Lightweight command palette (Cmd/Ctrl+K or "?"). Searches the dashboard nav
 * registry plus a couple of quick actions, with arrow-key navigation and Enter
 * to run. No external dependency — built on the existing Dialog + nav registry.
 */
export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate();
  const { resolvedTheme, setTheme } = useTheme();
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  const commands = useMemo<CommandItem[]>(() => {
    const nav: CommandItem[] = navItems.map((item) => {
      const letter = gotoLetterFor(item.to);
      return {
        id: `nav:${item.to}`,
        label: item.label,
        description: item.to,
        icon: item.icon,
        shortcut: letter ? `G ${letter.toUpperCase()}` : undefined,
        onSelect: () => navigate(item.to),
      };
    });

    const actions: CommandItem[] = [
      {
        id: 'action:new-checkout',
        label: 'Novo link de checkout',
        description: 'Criar uma nova cobrança',
        icon: Plus,
        onSelect: () => navigate('/dashboard/checkout'),
      },
      {
        id: 'action:toggle-theme',
        label: resolvedTheme === 'dark' ? 'Alternar para tema claro' : 'Alternar para tema escuro',
        description: 'Mudar aparência da interface',
        icon: SunMoon,
        onSelect: () => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark'),
      },
    ];

    return [...nav, ...actions];
  }, [navigate, resolvedTheme, setTheme]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((c) =>
      [c.label, c.description, c.shortcut].filter(Boolean).join(' ').toLowerCase().includes(q),
    );
  }, [commands, query]);

  const run = (item: CommandItem | undefined) => {
    if (!item) return;
    item.onSelect();
    onOpenChange(false);
    setQuery('');
    setActiveIndex(0);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="sm:max-w-lg">
        <div className="flex items-center gap-2 border-b pb-3">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <Input
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveIndex((i) => Math.max(i - 1, 0));
              } else if (e.key === 'Enter') {
                e.preventDefault();
                run(filtered[activeIndex]);
              }
            }}
            placeholder="Buscar páginas e ações..."
            className="h-8 border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
          />
        </div>

        <div
          data-slot="command-list"
          className="flex max-h-[min(60vh,380px)] flex-col overflow-y-auto"
        >
          {filtered.length === 0 ? (
            <p className="px-2 py-8 text-center text-sm text-muted-foreground">
              Nenhum resultado para “{query}”
            </p>
          ) : (
            filtered.map((item, index) => {
              const Icon = item.icon;
              const active = index === activeIndex;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => run(item)}
                  onMouseMove={() => setActiveIndex(index)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm transition-colors',
                    active ? 'bg-accent text-accent-foreground' : 'text-foreground',
                  )}
                >
                  <span
                    className={cn(
                      'flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground',
                      active && 'bg-background text-foreground',
                    )}
                  >
                    <Icon className="size-4" />
                  </span>
                  <span className="grid min-w-0 flex-1 gap-0.5">
                    <span className="truncate font-medium">{item.label}</span>
                    {item.description ? (
                      <span className="truncate font-mono text-xs text-muted-foreground">
                        {item.description}
                      </span>
                    ) : null}
                  </span>
                  {item.shortcut ? <Kbd>{item.shortcut}</Kbd> : null}
                  {active ? <CornerDownLeft className="size-3.5 text-muted-foreground" /> : null}
                </button>
              );
            })
          )}
        </div>

        <div className="flex items-center gap-3 border-t pt-3 text-xs text-muted-foreground">
          <KbdGroup>
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd>
            navegar
          </KbdGroup>
          <KbdGroup>
            <Kbd>↵</Kbd>
            abrir
          </KbdGroup>
          <span className="ml-auto hidden sm:inline">
            Atalhos: <Kbd>G</Kbd> + letra · <Kbd>?</Kbd>
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
