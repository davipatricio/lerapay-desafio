import { useState } from 'react';
import type { LinksFunction, MetaFunction } from 'react-router';
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from 'react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { getQueryClient } from './lib/query/client';
import stylesheet from './app.css?url';

export const links: LinksFunction = () => [{ rel: 'stylesheet', href: stylesheet }];

export const meta: MetaFunction = () => [
  { title: 'LeraPay' },
  { name: 'description', content: 'LeraPay BaaS' },
];

export default function App() {
  const [queryClient] = useState(() => getQueryClient());

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <QueryClientProvider client={queryClient}>
          <Outlet />
          {import.meta.env.DEV && (
            <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" />
          )}
        </QueryClientProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
