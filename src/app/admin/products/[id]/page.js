import { notFound } from 'next/navigation';
import Link from 'next/link';
import connectDB from '@/lib/mongodb.js';
import Product from '@/models/Product.js';
import { getSession } from '@/lib/auth.js';
import ProductDetailClientView from './ProductDetailClientView';

export const instant = false;

export const metadata = {
  title: 'Accessory Details | Retail Catalogue',
  description: 'View phone accessory inventory specifications, stock and retail details',
};

export default async function ProductDetailPage({ params }) {
  const { id } = await params;

  await connectDB();

  let product = null;
  try {
    product = await Product.findById(id).lean();
  } catch (err) {
    notFound();
  }

  if (!product || product.status === 'ARCHIVED') {
    notFound();
  }

  const session = await getSession();
  const user = session
    ? {
        id: session.sub,
        name: session.name,
        username: session.username,
        role: session.role,
      }
    : null;

  // Serialize product for Client Component
  const serializedProduct = {
    ...product,
    _id: product._id.toString(),
    category: product.category?.toString() || '',
    brand: product.brand?.toString() || '',
    createdAt: product.createdAt?.toISOString() || null,
    updatedAt: product.updatedAt?.toISOString() || null,
    specifications:
      product.specifications instanceof Map
        ? Object.fromEntries(product.specifications)
        : product.specifications || {},
  };

  return <ProductDetailClientView product={serializedProduct} user={user} />;
}
