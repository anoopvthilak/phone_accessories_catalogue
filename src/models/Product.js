import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide product name'],
      trim: true,
      maxlength: [200, 'Product name cannot exceed 200 characters'],
      index: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Please select a category'],
      index: true,
    },
    categoryName: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      index: true,
    },
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
      required: [true, 'Please select a brand'],
      index: true,
    },
    brandName: {
      type: String,
      required: [true, 'Brand name is required'],
      trim: true,
      index: true,
    },
    sku: {
      type: String,
      required: [true, 'Please provide SKU'],
      unique: true,
      trim: true,
      uppercase: true,
      maxlength: [50, 'SKU cannot exceed 50 characters'],
    },
    price: {
      type: Number,
      required: [true, 'Please provide selling price'],
      min: [0, 'Selling price must be 0 or greater'],
    },
    mrp: {
      type: Number,
      required: [true, 'Please provide MRP'],
      min: [0, 'MRP must be 0 or greater'],
      validate: {
        validator: function (val) {
          if (this.price !== undefined && val < this.price) {
            return false;
          }
          return true;
        },
        message: 'MRP cannot be less than selling price',
      },
    },
    // Store image URLs or storage paths only (Rule: Do not store image binaries in MongoDB). Max 3 images.
    images: {
      type: [String],
      default: [],
      validate: [
        {
          validator: function (images) {
            return Array.isArray(images) && images.length <= 3;
          },
          message: 'A maximum of 3 product images is allowed',
        },
        {
          validator: function (images) {
            return images.every((img) => typeof img === 'string' && !img.startsWith('data:image/'));
          },
          message: 'Image binaries/data-URIs are not allowed in MongoDB. Store image URLs or file paths.',
        },
      ],
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },
    specifications: {
      type: Map,
      of: String,
      default: {},
    },
    compatibility: {
      type: [String],
      default: [],
      index: true,
    },
    warranty: {
      type: String,
      trim: true,
      default: 'No Warranty',
      maxlength: [100, 'Warranty cannot exceed 100 characters'],
    },
    inStock: {
      type: Boolean,
      default: true,
      index: true,
    },
    stock: {
      type: Number,
      min: [0, 'Stock cannot be negative'],
      default: 1,
    },
    status: {
      type: String,
      enum: {
        values: ['ACTIVE', 'INACTIVE', 'OUT_OF_STOCK'],
        message: '{VALUE} is not a valid status',
      },
      default: 'ACTIVE',
      index: true,
    },
    featured: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Keep inStock synchronized before saving
ProductSchema.pre('save', function () {
  if (this.stock !== undefined && this.stock !== null) {
    this.inStock = this.stock > 0 && this.status !== 'OUT_OF_STOCK';
  }
});

// Text index for multi-field search across product title, brand, category, compatibility, SKU & description
ProductSchema.index(
  {
    name: 'text',
    sku: 'text',
    brandName: 'text',
    compatibility: 'text',
    categoryName: 'text',
    description: 'text',
  },
  {
    weights: {
      name: 10,
      sku: 8,
      brandName: 6,
      compatibility: 5,
      categoryName: 3,
      description: 1,
    },
    name: 'ProductCatalogueTextIndex',
  }
);

// Active status + search field compound indexes for filtered search across 10,000+ products
ProductSchema.index({ status: 1, sku: 1 });
ProductSchema.index({ status: 1, name: 1 });
ProductSchema.index({ status: 1, brandName: 1 });
ProductSchema.index({ status: 1, categoryName: 1 });
ProductSchema.index({ status: 1, compatibility: 1 });

// 3. Default pagination index (sorted by latest active products)
ProductSchema.index({ status: 1, createdAt: -1 });

// 4. Category pagination and price sorting
ProductSchema.index({ category: 1, status: 1, createdAt: -1 });
ProductSchema.index({ category: 1, status: 1, price: 1 });
ProductSchema.index({ category: 1, status: 1, price: -1 });

// 5. Brand pagination and price sorting
ProductSchema.index({ brand: 1, status: 1, createdAt: -1 });
ProductSchema.index({ brand: 1, status: 1, price: 1 });
ProductSchema.index({ brand: 1, status: 1, price: -1 });

// 6. Combined Category + Brand filtering
ProductSchema.index({ category: 1, brand: 1, status: 1, price: 1 });

// 7. Compatibility multikey index for device-specific lookups (e.g. "iPhone 15 Pro")
ProductSchema.index({ compatibility: 1, status: 1, createdAt: -1 });

export default mongoose.models.Product || mongoose.model('Product', ProductSchema);
