import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb.js';
import Enquiry from '@/models/Enquiry.js';
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
        { customerName: { $regex: escaped, $options: 'i' } },
        { customerPhone: { $regex: escaped, $options: 'i' } },
        { enquiryNumber: { $regex: escaped, $options: 'i' } },
        { productName: { $regex: escaped, $options: 'i' } },
        { brandName: { $regex: escaped, $options: 'i' } },
      ];
    }

    const [enquiries, total, statsAggregation] = await Promise.all([
      Enquiry.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('product', 'name price images inStock stock')
        .lean(),
      Enquiry.countDocuments(query),
      Enquiry.aggregate([
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
      ENQUIRED: 0,
      ORDERED: 0,
      ON_THE_WAY: 0,
      DELIVERED: 0,
      NOTIFIED: 0,
      COMPLETED: 0,
      CANCELLED: 0,
    };

    statsAggregation.forEach((item) => {
      if (stats[item._id] !== undefined) {
        stats[item._id] = item.count;
      }
      stats.TOTAL += item.count;
    });

    return NextResponse.json({
      enquiries,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
      stats,
    });
  } catch (error) {
    console.error('Error fetching enquiries:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve enquiries', details: error.message },
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
      productType,
      productId,
      productName,
      categoryName,
      brandName,
      quantity,
      targetPrice,
      advancePaid,
      customerNotes,
      supplierName,
      supplierOrderRef,
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

    // Generate unique human-readable enquiry number: ENQ-YYMM-XXXX
    const datePrefix = new Date().toISOString().slice(2, 7).replace('-', '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const enquiryNumber = `ENQ-${datePrefix}-${randomSuffix}`;

    const employeeName = session.name || session.username || 'Staff';

    const newEnquiry = await Enquiry.create({
      enquiryNumber,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerEmail: customerEmail ? customerEmail.trim() : '',
      productType: productType === 'NEW_CUSTOM_ITEM' ? 'NEW_CUSTOM_ITEM' : 'EXISTING_PRODUCT',
      product: productId || null,
      productName: productName.trim(),
      categoryName: categoryName?.trim() || 'General Accessories',
      brandName: brandName?.trim() || 'General',
      quantity: Number(quantity) > 0 ? Number(quantity) : 1,
      targetPrice: Number(targetPrice) >= 0 ? Number(targetPrice) : 0,
      advancePaid: Number(advancePaid) >= 0 ? Number(advancePaid) : 0,
      customerNotes: customerNotes ? customerNotes.trim() : '',
      supplierName: supplierName ? supplierName.trim() : '',
      supplierOrderRef: supplierOrderRef ? supplierOrderRef.trim() : '',
      status: 'ENQUIRED',
      createdBy: employeeName,
      lastUpdatedBy: employeeName,
      statusHistory: [
        {
          status: 'ENQUIRED',
          notes: customerNotes ? `Customer enquiry registered: ${customerNotes}` : 'Customer enquiry registered at shop counter',
          changedBy: employeeName,
          timestamp: new Date(),
        },
      ],
    });

    return NextResponse.json(
      {
        message: 'Customer enquiry registered successfully',
        enquiry: newEnquiry,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating enquiry:', error);
    return NextResponse.json(
      { error: 'Failed to record enquiry', details: error.message },
      { status: 500 }
    );
  }
}
