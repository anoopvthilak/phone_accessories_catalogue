import { notFound, redirect } from 'next/navigation';
import connectDB from '@/lib/mongodb.js';
import Product from '@/models/Product.js';
import Category from '@/models/Category.js';
import Brand from '@/models/Brand.js';
import { getSession } from '@/lib/auth.js';
import EditProductForm from './EditProductForm';

export const instant = false;

export const metadata = {
  title: 'Edit Accessory | Retail Catalogue',
  description: 'Modify phone accessory specifications, price, stock, and compatibility',
};

export default async function EditProductPage({ params }) {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

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

  // Fetch categories and brands
  const [categories, brands] = await Promise.all([
    Category.find().sort({ displayOrder: 1, name: 1 }).lean(),
    Brand.find().sort({ name: 1 }).lean(),
  ]);

  const user = {
    id: session.sub,
    name: session.name,
    username: session.username,
    role: session.role,
  };

  const serializedProduct = {
    ...product,
    _id: product._id.toString(),
    category: product.category?.toString() || '',
    brand: product.brand?.toString() || '',
    specifications:
      product.specifications instanceof Map
        ? Object.fromEntries(product.specifications)
        : product.specifications || {},
  };

  const serializedCategories = categories.map((c) => ({
    ...c,
    _id: c._id.toString(),
  }));

  const serializedBrands = brands.map((b) => ({
    ...b,
    _id: b._id.toString(),
  }));

  return (
    <EditProductForm
      initialProduct={serializedProduct}
      initialCategories={serializedCategories}
      initialBrands={serializedBrands}
      user={user}
    />
  );
}
