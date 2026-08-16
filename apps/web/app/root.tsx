import { useState } from 'react';
import type { LinksFunction, MetaFunction } from 'react-router';
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from 'react-router';
import { ThemeProvider } from 'next-themes';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { getQueryClient } from './lib/query/client';
import { getApiBaseUrl } from './lib/api/config';
import { Toaster } from '@/components/ui/sonner';
import stylesheet from './app.css?url';

export const links: LinksFunction = () => {
  // Preconnect to the API origin so the first data fetches resolve faster.
  let apiOrigin = getApiBaseUrl();
  try {
    apiOrigin = new URL(getApiBaseUrl()).origin;
  } catch {
    // fall back to the raw base URL if it isn't a valid absolute URL
  }
  return [
    { rel: 'stylesheet', href: stylesheet },
    { rel: 'preconnect', href: apiOrigin, crossOrigin: 'anonymous' },
    { rel: 'dns-prefetch', href: apiOrigin },
  ];
};

export const meta: MetaFunction = () => [
  { title: 'LeraPay' },
  { name: 'description', content: 'LeraPay BaaS' },
];

export default function App() {
  const [queryClient] = useState(() => getQueryClient());

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryClientProvider client={queryClient}>
            <Outlet />
            <Toaster richColors closeButton />
            {import.meta.env.DEV && (
              <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" />
            )}
          </QueryClientProvider>
        </ThemeProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
