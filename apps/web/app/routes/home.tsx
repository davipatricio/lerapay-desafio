import { Button } from '@/components/ui/button';
import type { Route } from './+types/home';

export function meta(_: Route.MetaArgs) {
  return [{ title: 'LeraPay' }];
}

export default function Home() {
  return (
    <main>
      <h1>Teste</h1>
      <Button variant="default" size="lg">
        Test Button
      </Button>
    </main>
  );
}
