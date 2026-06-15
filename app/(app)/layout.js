import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/auth';
import Shell from './Shell';
export const dynamic = 'force-dynamic';
export default async function AppLayout({ children }) {
  const user = await currentUser();
  if (!user) redirect('/login');
  return <Shell user={user}>{children}</Shell>;
}
