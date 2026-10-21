import { getSession } from '@/lib/auth.js';
import EnquiriesView from '@/components/EnquiriesView';

export const instant = false;

export const metadata = {
  title: 'Customer Enquiries & Special Orders | Retail Hub',
  description: 'Manage customer enquiries, out of stock requests, new item orders, and fulfillment pipeline',
};

export default async function EnquiriesPage() {
  const session = await getSession();

  const user = session
    ? {
        id: session.sub,
        name: session.name,
        username: session.username,
        role: session.role,
      }
    : null;

  return <EnquiriesView initialUser={user} />;
}
