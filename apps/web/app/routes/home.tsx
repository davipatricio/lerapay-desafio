import { redirect } from 'react-router';
import type { Route } from './+types/home';

/**
 * The index route redirects authenticated users to the dashboard.
 * Unauthenticated users are bounced to the login screen by the app-shell guard.
 */
export function loader(_: Route.LoaderArgs) {
  return redirect('/dashboard');
}

export default function Home() {
  return null;
}
