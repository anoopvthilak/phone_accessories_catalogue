import { getSession } from '@/lib/auth.js';
import CatalogueView from '@/components/CatalogueView';

export const instant = false;

export const metadata = {
  title: 'Phone Accessories Catalogue | Retail Inventory',
  description: 'Internal phone accessories catalog, inventory viewing and search portal',
};

export default async function HomePage() {
  const session = await getSession();

  const user = session
    ? {
        id: session.sub,
        name: session.name,
        username: session.username,
        role: session.role,
      }
    : null;

  return <CatalogueView initialUser={user} />;
}
