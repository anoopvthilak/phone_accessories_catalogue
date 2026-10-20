import { getSession } from '@/lib/auth.js';
import WarrantiesView from '@/components/WarrantiesView';

export const metadata = {
  title: 'Customer Warranty & RMA Service Tracker | Retail Hub',
  description: 'Track customer warranty claims, service center status, and fast caller lookup for accessories',
};

export default async function WarrantiesPage() {
  const session = await getSession();

  const user = session
    ? {
        id: session.sub,
        name: session.name,
        username: session.username,
        role: session.role,
      }
    : null;

  return <WarrantiesView initialUser={user} />;
}
