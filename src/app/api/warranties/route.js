import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb.js';
import WarrantyClaim from '@/models/WarrantyClaim.js';
import { getSession } from '@/lib/auth.js';

export async function GET(request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search')?.trim() || '';
    const status = searchParams.get('status')?.trim() || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const skip = (page - 1) * limit;

    const query = {};

    if (status && status !== 'ALL') {
      query.status = status;
    }

    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { customerPhone: { $regex: escaped, $options: 'i' } },
        { ticketNumber: { $regex: escaped, $options: 'i' } },
        { customerName: { $regex: escaped, $options: 'i' } },
        { serialNumber: { $regex: escaped, $options: 'i' } },
        { billNumber: { $regex: escaped, $options: 'i' } },
        { productName: { $regex: escaped, $options: 'i' } },
        { brandName: { $regex: escaped, $options: 'i' } },
      ];
    }

    const [warranties, total, statsAggregation] = await Promise.all([
      WarrantyClaim.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('product', 'name price images inStock sku')
        .lean(),
      WarrantyClaim.countDocuments(query),
      WarrantyClaim.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const stats = {
      TOTAL: 0,
      RECEIVED_AT_SHOP: 0,
      SENT_TO_SERVICE_CENTER: 0,
      UNDER_INSPECTION: 0,
      REPLACED_OR_REPAIRED: 0,
      RECEIVED_BACK_AT_SHOP: 0,
      NOTIFIED_FOR_PICKUP: 0,
      DELIVERED_TO_CUSTOMER: 0,
      REJECTED: 0,
    };

    statsAggregation.forEach((item) => {
      if (stats[item._id] !== undefined) {
        stats[item._id] = item.count;
      }
      stats.TOTAL += item.count;
    });

    return NextResponse.json({
      warranties,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
      stats,
    });
  } catch (error) {
    console.error('Error fetching warranties:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve warranty claims', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const {
      customerName,
      customerPhone,
      customerEmail,
      productId,
      productName,
      brandName,
      categoryName,
      serialNumber,
      billNumber,
      purchaseDate,
      warrantyType,
      issueDescription,
      physicalCondition,
      accessoriesIncluded,
      serviceCenterName,
    } = body;

    if (!customerName || !customerName.trim()) {
      return NextResponse.json(
        { error: 'Customer name is required' },
        { status: 400 }
      );
    }

    if (!customerPhone || !customerPhone.trim()) {
      return NextResponse.json(
        { error: 'Customer phone number is required' },
        { status: 400 }
      );
    }

    if (!productName || !productName.trim()) {
      return NextResponse.json(
        { error: 'Product name is required' },
        { status: 400 }
      );
    }

    if (!issueDescription || !issueDescription.trim()) {
      return NextResponse.json(
        { error: 'Issue description is required' },
        { status: 400 }
      );
    }

    // Generate unique human-readable ticket number: WRN-YYMM-XXXX
    const datePrefix = new Date().toISOString().slice(2, 7).replace('-', '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const ticketNumber = `WRN-${datePrefix}-${randomSuffix}`;

    const employeeName = session.name || session.username || 'Staff';

    const newClaim = await WarrantyClaim.create({
      ticketNumber,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerEmail: customerEmail ? customerEmail.trim() : '',
      product: productId || null,
      productName: productName.trim(),
      brandName: brandName?.trim() || 'General',
      categoryName: categoryName?.trim() || 'General Accessories',
      serialNumber: serialNumber ? serialNumber.trim() : '',
      billNumber: billNumber ? billNumber.trim() : '',
      purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
      warrantyType: warrantyType || 'Brand Warranty',
      issueDescription: issueDescription.trim(),
      physicalCondition: physicalCondition?.trim() || 'Normal store intake condition',
      accessoriesIncluded: accessoriesIncluded?.trim() || 'Item only',
      serviceCenterName: serviceCenterName ? serviceCenterName.trim() : '',
      status: 'RECEIVED_AT_SHOP',
      receivedBy: employeeName,
      statusHistory: [
        {
          status: 'RECEIVED_AT_SHOP',
          notes: `Item accepted at shop counter: ${issueDescription.trim()}`,
          updatedBy: employeeName,
          timestamp: new Date(),
        },
      ],
    });

    return NextResponse.json(
      {
        message: 'Warranty ticket registered successfully',
        warranty: newClaim,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating warranty claim:', error);
    return NextResponse.json(
      { error: 'Failed to record warranty claim', details: error.message },
      { status: 500 }
    );
  }
}
