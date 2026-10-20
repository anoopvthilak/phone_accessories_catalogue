import mongoose from 'mongoose';

const EnquirySchema = new mongoose.Schema(
  {
    enquiryNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    customerName: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
      maxlength: [120, 'Customer name cannot exceed 120 characters'],
      index: true,
    },
    customerPhone: {
      type: String,
      required: [true, 'Customer phone number is required'],
      trim: true,
      index: true,
    },
    customerEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    productType: {
      type: String,
      enum: ['EXISTING_PRODUCT', 'NEW_CUSTOM_ITEM'],
      default: 'EXISTING_PRODUCT',
      index: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      default: null,
    },
    productName: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [200, 'Product name cannot exceed 200 characters'],
      index: true,
    },
    categoryName: {
      type: String,
      trim: true,
      default: 'General Accessories',
    },
    brandName: {
      type: String,
      trim: true,
      default: 'General',
    },
    quantity: {
      type: Number,
      default: 1,
      min: [1, 'Quantity must be at least 1'],
    },
    targetPrice: {
      type: Number,
      default: 0,
      min: [0, 'Target price cannot be negative'],
    },
    advancePaid: {
      type: Number,
      default: 0,
      min: [0, 'Advance paid cannot be negative'],
    },
    customerNotes: {
      type: String,
      trim: true,
      default: '',
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    },
    status: {
      type: String,
      enum: {
        values: [
          'ENQUIRED',
          'ORDERED',
          'ON_THE_WAY',
          'DELIVERED',
          'NOTIFIED',
          'COMPLETED',
          'CANCELLED',
        ],
        message: '{VALUE} is not a valid enquiry status',
      },
      default: 'ENQUIRED',
      index: true,
    },
    supplierName: {
      type: String,
      trim: true,
      default: '',
    },
    supplierOrderRef: {
      type: String,
      trim: true,
      default: '',
    },
    statusHistory: [
      {
        status: {
          type: String,
          required: true,
        },
        notes: {
          type: String,
          trim: true,
          default: '',
        },
        changedBy: {
          type: String,
          default: 'Staff',
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    createdBy: {
      type: String,
      default: 'Staff',
    },
    lastUpdatedBy: {
      type: String,
      default: 'Staff',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound indexes for searching & filtering
EnquirySchema.index({ customerPhone: 1, status: 1 });
EnquirySchema.index({ status: 1, createdAt: -1 });
EnquirySchema.index({ createdAt: -1 });

export default mongoose.models.Enquiry || mongoose.model('Enquiry', EnquirySchema);
