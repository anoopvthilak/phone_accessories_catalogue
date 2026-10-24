import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb.js';
import Product from '@/models/Product.js';
import Category from '@/models/Category.js';
import Brand from '@/models/Brand.js';
import { getSession } from '@/lib/auth.js';
import { deleteFromSpaces, isSpacesUrl } from '@/lib/spaces.js';

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

// GET: Fetch product details by ID
export async function GET(request, { params }) {
  try {
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid product ID format' },
        { status: 400 }
      );
    }

    await connectDB();

    const product = await Product.findById(id)
      .populate('category', 'name slug')
      .populate('brand', 'name slug')
      .lean();

    if (!product || product.status === 'ARCHIVED') {
      return NextResponse.json(
        { error: 'Product not found in catalogue' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      product,
    });
  } catch (error) {
    if (error?.digest) throw error;
    console.error('Fetch product detail error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve product details' },
      { status: 500 }
    );
  }
}

// PUT: Edit/Update existing product
export async function PUT(request, { params }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Per specifications: ADMIN and STAFF can edit products
    if (session.role !== 'ADMIN' && session.role !== 'STAFF') {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient privileges' },
        { status: 403 }
      );
    }

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid product ID format' },
        { status: 400 }
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
      featured,
    } = body;

    // Server-side validation
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json(
        { error: 'Product title is required (minimum 2 characters)' },
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

    await connectDB();

    // Verify existing product
    const existingProduct = await Product.findById(id);
    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

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

    // Validate SKU uniqueness (excluding this product)
    const normalizedSku = (typeof sku === 'string' && sku.trim() ? sku.trim().toUpperCase() : existingProduct.sku);
    const skuConflict = await Product.findOne({
      sku: normalizedSku,
      _id: { $ne: id },
    });

    if (skuConflict) {
      return NextResponse.json(
        { error: `SKU "${normalizedSku}" is already used by another product (${skuConflict.name})` },
        { status: 400 }
      );
    }

    // Strictly validate image URLs (no data URIs / binaries in MongoDB, max 3 images)
    const validImages = Array.isArray(images)
      ? images.filter((img) => typeof img === 'string' && img.trim() && !img.startsWith('data:image/'))
      : existingProduct.images;

    if (validImages.length > 3) {
      return NextResponse.json(
        { error: 'A maximum of 3 product images is allowed' },
        { status: 400 }
      );
    }

    // Determine stock availability
    const isAvailable = inStock !== false && inStock !== 'false' && status !== 'OUT_OF_STOCK';
    const parsedStock = stock !== undefined && stock !== null
      ? Math.max(0, parseInt(stock, 10) || 0)
      : (isAvailable ? 1 : 0);

    const productStatus = status || (isAvailable ? 'ACTIVE' : 'OUT_OF_STOCK');

    // Update document fields
    existingProduct.name = name.trim();
    existingProduct.category = categoryDoc._id;
    existingProduct.categoryName = categoryDoc.name;
    existingProduct.brand = brandDoc._id;
    existingProduct.brandName = brandDoc.name;
    existingProduct.sku = normalizedSku;
    existingProduct.price = parsedPrice;
    existingProduct.mrp = parsedMrp;
    existingProduct.inStock = isAvailable;
    existingProduct.stock = parsedStock;
    existingProduct.images = validImages;
    existingProduct.description = description !== undefined ? description.trim() : existingProduct.description;
    existingProduct.specifications = specifications || {};
    existingProduct.compatibility = Array.isArray(compatibility) ? compatibility.filter(Boolean) : [];
    existingProduct.warranty = warranty !== undefined ? warranty.trim() : existingProduct.warranty;
    existingProduct.status = productStatus;
    if (featured !== undefined) {
      existingProduct.featured = Boolean(featured);
    }

    const updatedProduct = await existingProduct.save();

    return NextResponse.json({
      success: true,
      message: 'Product updated successfully',
      product: updatedProduct,
    });
  } catch (error) {
    if (error?.digest) throw error;
    console.error('Product update error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update product' },
      { status: 500 }
    );
  }
}

// DELETE: Delete product from catalogue (Confirmation required on client, ADMIN only)
export async function DELETE(request, { params }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Role check: Only ADMIN role is permitted to delete products
    if (session.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden: Only administrators can delete products from the catalogue' },
        { status: 403 }
      );
    }

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid product ID format' },
        { status: 400 }
      );
    }

    await connectDB();

    const product = await Product.findById(id);
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    const productName = product.name;
    const productSku = product.sku;

    // Permanently remove product from collection
    await Product.findByIdAndDelete(id);

    // Clean up associated images in DigitalOcean Spaces if applicable
    if (Array.isArray(product.images)) {
      for (const imgUrl of product.images) {
        if (isSpacesUrl(imgUrl)) {
          deleteFromSpaces(imgUrl).catch((err) =>
            console.error('Failed to clean up space image on product delete:', err)
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Product "${productName}" (${productSku}) was permanently removed from catalogue`,
    });
  } catch (error) {
    if (error?.digest) throw error;
    console.error('Product deletion error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete product' },
      { status: 500 }
    );
  }
}
