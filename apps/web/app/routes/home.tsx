import type { Route } from './+types/home';

export function meta(_: Route.MetaArgs) {
  return [{ title: 'LeraPay' }];
}

export default function Home() {
  return (
    <main>
      <h1>Teste</h1>
    </main>
  );
}
