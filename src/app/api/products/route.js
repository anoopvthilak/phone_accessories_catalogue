import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb.js';
import Product from '@/models/Product.js';
import Category from '@/models/Category.js';
import Brand from '@/models/Brand.js';
import { getSession } from '@/lib/auth.js';

async function resolveBrand(brandInput) {
  if (!brandInput || typeof brandInput !== 'string') return null;
  const trimmed = brandInput.trim();
  if (!trimmed) return null;

  // Check if it's a valid 24-char ObjectId
  if (mongoose.Types.ObjectId.isValid(trimmed) && String(new mongoose.Types.ObjectId(trimmed)) === trimmed) {
    const byId = await Brand.findById(trimmed);
    if (byId) return byId;
  }

  // Look up case-insensitively by name
  const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  let brandDoc = await Brand.findOne({
    name: { $regex: new RegExp(`^${escaped}$`, 'i') },
  });

  if (!brandDoc) {
    let baseSlug = trimmed
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '') || 'brand';
    let slug = baseSlug;
    let counter = 1;
    while (await Brand.findOne({ slug })) {
      slug = `${baseSlug}-${counter++}`;
    }

    brandDoc = await Brand.create({
      name: trimmed,
      slug,
      isActive: true,
    });
  }

  return brandDoc;
}

export async function GET(request) {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search')?.trim() || '';
    const category = searchParams.get('category')?.trim() || '';
    const brand = searchParams.get('brand')?.trim() || '';
    const stockStatus = searchParams.get('stock')?.trim() || '';
    const sort = searchParams.get('sort') || 'latest';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '12', 10)));
    const skip = (page - 1) * limit;

    // Build query filter
    const query = { status: { $ne: 'ARCHIVED' } };

    // Search query using text index and multi-field regex across 5 key fields:
    // 1. Product Name, 2. SKU, 3. Brand, 4. Category, 5. Compatibility
    let hasTextSearch = false;
    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const orConditions = [
        { name: { $regex: escaped, $options: 'i' } },
        { sku: { $regex: `^${escaped}`, $options: 'i' } },
        { sku: { $regex: escaped, $options: 'i' } },
        { brandName: { $regex: escaped, $options: 'i' } },
        { categoryName: { $regex: escaped, $options: 'i' } },
        { compatibility: { $elemMatch: { $regex: escaped, $options: 'i' } } },
      ];

      // Add $text query when alphanumeric term is provided for natural relevance scoring
      if (/[a-zA-Z0-9]{2,}/.test(search)) {
        orConditions.unshift({ $text: { $search: search } });
        hasTextSearch = true;
      }

      query.$or = orConditions;
    }

    // Category filter
    if (category && category !== 'All' && category !== 'all') {
      query.categoryName = { $regex: `^${category}$`, $options: 'i' };
    }

    // Brand filter
    if (brand && brand !== 'All' && brand !== 'all') {
      query.brandName = { $regex: `^${brand}$`, $options: 'i' };
    }

    // Stock status filter
    if (stockStatus === 'in_stock') {
      query.inStock = { $ne: false };
      query.status = { $ne: 'OUT_OF_STOCK' };
    } else if (stockStatus === 'out_of_stock') {
      query.$or = [{ inStock: false }, { status: 'OUT_OF_STOCK' }, { stock: { $lte: 0 } }];
    }

    // Sort definition optimized for MongoDB compound indexes
    let sortOptions = { createdAt: -1 };
    if (sort === 'price_asc') {
      sortOptions = { price: 1, createdAt: -1 };
    } else if (sort === 'price_desc') {
      sortOptions = { price: -1, createdAt: -1 };
    } else if (sort === 'name_asc') {
      sortOptions = { name: 1, createdAt: -1 };
    } else if (hasTextSearch && !searchParams.get('sort')) {
      sortOptions = { score: { $meta: 'textScore' }, createdAt: -1 };
    }

    const projection = hasTextSearch && !searchParams.get('sort') ? { score: { $meta: 'textScore' } } : {};

    const [products, total] = await Promise.all([
      Product.find(query, projection)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      products,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    if (error?.digest) {
      throw error;
    }
    console.error('Products fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch catalogue products' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Both ADMIN and STAFF are allowed to add products per project specs
    if (session.role !== 'ADMIN' && session.role !== 'STAFF') {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient privileges' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      name,
      categoryId,
      brandId,
      brandName,
      brand,
      sku,
      price,
      mrp,
      stock,
      inStock,
      images,
      description,
      specifications,
      compatibility,
      warranty,
      status,
    } = body;

    // Server-side validation
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json(
        { error: 'Product name is required (minimum 2 characters)' },
        { status: 400 }
      );
    }

    if (!categoryId) {
      return NextResponse.json(
        { error: 'Product category is required' },
        { status: 400 }
      );
    }

    const brandInput = (brandName || brand || brandId || '').toString().trim();
    if (!brandInput) {
      return NextResponse.json(
        { error: 'Product brand is required' },
        { status: 400 }
      );
    }

    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      return NextResponse.json(
        { error: 'MOP (selling price) must be a valid positive number' },
        { status: 400 }
      );
    }

    const parsedMrp = parseFloat(mrp);
    if (isNaN(parsedMrp) || parsedMrp < parsedPrice) {
      return NextResponse.json(
        { error: 'MRP must be greater than or equal to MOP' },
        { status: 400 }
      );
    }

    // Determine inStock boolean availability
    const isAvailable = inStock !== false && inStock !== 'false' && status !== 'OUT_OF_STOCK';
    const parsedStock = stock !== undefined && stock !== null ? Math.max(0, parseInt(stock, 10) || 0) : (isAvailable ? 1 : 0);

    await connectDB();

    // Look up category
    const categoryDoc = await Category.findById(categoryId);
    if (!categoryDoc) {
      return NextResponse.json(
        { error: 'Selected category does not exist' },
        { status: 400 }
      );
    }

    // Look up or auto-create brand
    const brandDoc = await resolveBrand(brandInput);
    if (!brandDoc) {
      return NextResponse.json(
        { error: 'Failed to resolve or create brand' },
        { status: 400 }
      );
    }

    // Clean & normalize SKU or auto-generate unique SKU if omitted
    let normalizedSku = typeof sku === 'string' && sku.trim() ? sku.trim().toUpperCase() : '';
    if (!normalizedSku) {
      const brandPrefix = (brandDoc.name || 'ACC')
        .replace(/[^a-zA-Z0-9]/g, '')
        .slice(0, 3)
        .toUpperCase() || 'ACC';
      let candidate = '';
      let isUnique = false;
      while (!isUnique) {
        const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
        candidate = `${brandPrefix}-${Date.now().toString().slice(-4)}-${rand}`;
        const conflict = await Product.findOne({ sku: candidate });
        if (!conflict) {
          isUnique = true;
        }
      }
      normalizedSku = candidate;
    } else {
      const existingSku = await Product.findOne({ sku: normalizedSku });
      if (existingSku) {
        return NextResponse.json(
          { error: `SKU "${normalizedSku}" is already in use by another product` },
          { status: 400 }
        );
      }
    }

    // Validate images (strictly reject data-URI / binary buffers, max 3 images)
    const validImages = Array.isArray(images)
      ? images.filter((img) => typeof img === 'string' && img.trim() && !img.startsWith('data:image/'))
      : [];

    if (validImages.length > 3) {
      return NextResponse.json(
        { error: 'A maximum of 3 product images is allowed' },
        { status: 400 }
      );
    }

    const newProduct = await Product.create({
      name: name.trim(),
      category: categoryDoc._id,
      categoryName: categoryDoc.name,
      brand: brandDoc._id,
      brandName: brandDoc.name,
      sku: normalizedSku,
      price: parsedPrice,
      mrp: parsedMrp,
      inStock: isAvailable,
      stock: parsedStock,
      images: validImages,
      description: description ? description.trim() : '',
      specifications: specifications || {},
      compatibility: Array.isArray(compatibility) ? compatibility.filter(Boolean) : [],
      warranty: warranty ? warranty.trim() : 'No Warranty',
      status: isAvailable ? 'ACTIVE' : 'OUT_OF_STOCK',
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Product created successfully',
        product: newProduct,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Product creation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create product' },
      { status: 500 }
    );
  }
}
