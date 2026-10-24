import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb.js';
import WarrantyClaim from '@/models/WarrantyClaim.js';
import { getSession } from '@/lib/auth.js';

export async function GET(_request, { params }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;

    const warranty = await WarrantyClaim.findById(id).populate('product');
    if (!warranty) {
      return NextResponse.json({ error: 'Warranty claim not found' }, { status: 404 });
    }

    return NextResponse.json({ warranty });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to retrieve warranty claim', details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;
    const body = await request.json();

    const warranty = await WarrantyClaim.findById(id);
    if (!warranty) {
      return NextResponse.json({ error: 'Warranty claim not found' }, { status: 404 });
    }

    const employeeName = session.name || session.username || 'Staff';

    // Status transition or progress note
    if (body.status && body.status !== warranty.status) {
      const allowedStatuses = [
        'RECEIVED_AT_SHOP',
        'SENT_TO_SERVICE_CENTER',
        'UNDER_INSPECTION',
        'REPLACED_OR_REPAIRED',
        'RECEIVED_BACK_AT_SHOP',
        'NOTIFIED_FOR_PICKUP',
        'DELIVERED_TO_CUSTOMER',
        'REJECTED',
      ];

      if (!allowedStatuses.includes(body.status)) {
        return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
      }

      const noteText = body.statusNote?.trim() || `Status updated to ${body.status.replace(/_/g, ' ')}`;

      warranty.status = body.status;
      if (body.status === 'DELIVERED_TO_CUSTOMER' || body.status === 'REJECTED') {
        warranty.resolvedAt = new Date();
      }

      warranty.statusHistory.push({
        status: body.status,
        notes: noteText,
        updatedBy: employeeName,
        timestamp: new Date(),
      });
    } else if (body.statusNote?.trim()) {
      // Add status log without changing status
      warranty.statusHistory.push({
        status: warranty.status,
        notes: body.statusNote.trim(),
        updatedBy: employeeName,
        timestamp: new Date(),
      });
    }

    // Editable claim details
    if (body.customerName !== undefined) warranty.customerName = body.customerName.trim();
    if (body.customerPhone !== undefined) warranty.customerPhone = body.customerPhone.trim();
    if (body.customerEmail !== undefined) warranty.customerEmail = body.customerEmail.trim();
    if (body.productName !== undefined) warranty.productName = body.productName.trim();
    if (body.brandName !== undefined) warranty.brandName = body.brandName.trim();
    if (body.categoryName !== undefined) warranty.categoryName = body.categoryName.trim();
    if (body.serialNumber !== undefined) warranty.serialNumber = body.serialNumber.trim();
    if (body.billNumber !== undefined) warranty.billNumber = body.billNumber.trim();
    if (body.billAmount !== undefined) {
      warranty.billAmount = body.billAmount !== '' && body.billAmount !== null && !isNaN(Number(body.billAmount))
        ? Number(body.billAmount)
        : null;
    }
    if (body.replacedItem !== undefined) warranty.replacedItem = body.replacedItem.trim();
    if (body.serviceCenterName !== undefined) warranty.serviceCenterName = body.serviceCenterName.trim();
    if (body.serviceCenterRmaNo !== undefined) warranty.serviceCenterRmaNo = body.serviceCenterRmaNo.trim();
    if (body.resolutionNotes !== undefined) warranty.resolutionNotes = body.resolutionNotes.trim();
    if (body.issueDescription !== undefined) warranty.issueDescription = body.issueDescription.trim();
    if (body.physicalCondition !== undefined) warranty.physicalCondition = body.physicalCondition.trim();
    if (body.accessoriesIncluded !== undefined) warranty.accessoriesIncluded = body.accessoriesIncluded.trim();

    await warranty.save();

    return NextResponse.json({
      message: 'Warranty claim updated successfully',
      warranty,
    });
  } catch (error) {
    console.error('Error updating warranty claim:', error);
    return NextResponse.json(
      { error: 'Failed to update warranty claim', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(_request, { params }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;

    const deleted = await WarrantyClaim.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ error: 'Warranty claim not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Warranty claim deleted successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete warranty claim', details: error.message },
      { status: 500 }
    );
  }
}
