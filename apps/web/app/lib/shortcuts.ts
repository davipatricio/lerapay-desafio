'use client';

import { useEffect } from 'react';

/**
 * Two-key "goto" navigation shortcuts (vim-style `g <key>`). Pressing `g`
 * then a letter within the window jumps straight to that dashboard route.
 * Letters mirror the first letter of each nav label:
 *   d → Dashboard, c → Checkout, w → Carteira, t → Transações,
 *   s → Saques, h → Webhooks
 */
export const GOTO_KEYS: Record<string, string> = {
  d: '/dashboard',
  c: '/dashboard/checkout',
  w: '/dashboard/wallet',
  t: '/dashboard/transactions',
  s: '/dashboard/withdrawals',
  h: '/dashboard/webhooks',
};

const GOTO_WINDOW_MS = 1500;

interface UseGlobalShortcutsOptions {
  onNavigate: (path: string) => void;
  onOpenPalette: () => void;
}

/**
 * Registers app-wide keyboard shortcuts:
 *   - Cmd/Ctrl+K  opens the command palette
 *   - `?`         opens the command palette (shows all commands + shortcuts)
 *   - `g <key>`   jumps to a dashboard route
 *
 * Shortcuts are ignored while typing in an input / textarea / select or when
 * the focus is inside a dialog.
 */
export function useGlobalShortcuts({ onNavigate, onOpenPalette }: UseGlobalShortcutsOptions) {
  useEffect(() => {
    let lastG = 0;

    const isTyping = (target: EventTarget | null): boolean => {
      const el = target as HTMLElement | null;
      if (!el) return false;
      const tag = el.tagName;
      return (
        tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable === true
      );
    };

    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();

      // Cmd/Ctrl+K always works, even while typing.
      if ((event.metaKey || event.ctrlKey) && key === 'k') {
        event.preventDefault();
        onOpenPalette();
        return;
      }

      if (isTyping(event.target)) return;

      if (key === 'g') {
        lastG = Date.now();
        return;
      }

      if (lastG && Date.now() - lastG < GOTO_WINDOW_MS && GOTO_KEYS[key]) {
        lastG = 0;
        onNavigate(GOTO_KEYS[key]);
        return;
      }

      lastG = 0;

      if (event.key === '?') {
        onOpenPalette();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onNavigate, onOpenPalette]);
}
