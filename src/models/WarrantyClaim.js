import mongoose from 'mongoose';

const WarrantyClaimSchema = new mongoose.Schema(
  {
    ticketNumber: {
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
    brandName: {
      type: String,
      trim: true,
      default: 'General',
    },
    categoryName: {
      type: String,
      trim: true,
      default: 'General Accessories',
    },
    serialNumber: {
      type: String,
      trim: true,
      default: '',
      index: true,
    },
    billNumber: {
      type: String,
      trim: true,
      default: '',
    },
    billAmount: {
      type: Number,
      default: null,
    },
    purchaseDate: {
      type: Date,
      default: null,
    },
    warrantyType: {
      type: String,
      enum: ['Brand Warranty', 'Shop Warranty', 'Replacement Warranty', 'Other'],
      default: 'Brand Warranty',
    },
    issueDescription: {
      type: String,
      required: [true, 'Issue description is required'],
      trim: true,
      maxlength: [1500, 'Issue description cannot exceed 1500 characters'],
    },
    physicalCondition: {
      type: String,
      trim: true,
      default: 'Good condition, normal wear and tear',
      maxlength: [500, 'Condition description cannot exceed 500 characters'],
    },
    accessoriesIncluded: {
      type: String,
      trim: true,
      default: 'Item only',
      maxlength: [500, 'Accessories text cannot exceed 500 characters'],
    },
    status: {
      type: String,
      enum: {
        values: [
          'RECEIVED_AT_SHOP',
          'SENT_TO_SERVICE_CENTER',
          'UNDER_INSPECTION',
          'REPLACED_OR_REPAIRED',
          'RECEIVED_BACK_AT_SHOP',
          'NOTIFIED_FOR_PICKUP',
          'DELIVERED_TO_CUSTOMER',
          'REJECTED',
        ],
        message: '{VALUE} is not a valid warranty status',
      },
      default: 'RECEIVED_AT_SHOP',
      index: true,
    },
    serviceCenterName: {
      type: String,
      trim: true,
      default: '',
    },
    serviceCenterRmaNo: {
      type: String,
      trim: true,
      default: '',
    },
    replacedItem: {
      type: String,
      trim: true,
      default: '',
    },
    resolutionNotes: {
      type: String,
      trim: true,
      default: '',
      maxlength: [1000, 'Resolution notes cannot exceed 1000 characters'],
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
        updatedBy: {
          type: String,
          default: 'Staff',
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    receivedBy: {
      type: String,
      default: 'Staff',
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Helpful compound indexes
WarrantyClaimSchema.index({ customerPhone: 1, status: 1 });
WarrantyClaimSchema.index({ status: 1, createdAt: -1 });
WarrantyClaimSchema.index({ createdAt: -1 });

// In development, ensure schema changes are immediately picked up
if (process.env.NODE_ENV !== 'production' && mongoose.models.WarrantyClaim) {
  delete mongoose.models.WarrantyClaim;
}

export default mongoose.models.WarrantyClaim || mongoose.model('WarrantyClaim', WarrantyClaimSchema);
