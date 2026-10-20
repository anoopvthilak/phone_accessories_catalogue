import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb.js';
import Enquiry from '@/models/Enquiry.js';
import { getSession } from '@/lib/auth.js';

export async function GET(_request, { params }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;

    const enquiry = await Enquiry.findById(id).populate('product');
    if (!enquiry) {
      return NextResponse.json({ error: 'Enquiry not found' }, { status: 404 });
    }

    return NextResponse.json({ enquiry });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to retrieve enquiry', details: error.message },
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

    const enquiry = await Enquiry.findById(id);
    if (!enquiry) {
      return NextResponse.json({ error: 'Enquiry not found' }, { status: 404 });
    }

    const employeeName = session.name || session.username || 'Staff';

    // If status is changed or a status update note is provided
    if (body.status && body.status !== enquiry.status) {
      const allowedStatuses = [
        'ENQUIRED',
        'ORDERED',
        'ON_THE_WAY',
        'DELIVERED',
        'NOTIFIED',
        'COMPLETED',
        'CANCELLED',
      ];

      if (!allowedStatuses.includes(body.status)) {
        return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
      }

      const noteText = body.statusNote?.trim() || `Status updated to ${body.status}`;

      enquiry.status = body.status;
      enquiry.statusHistory.push({
        status: body.status,
        notes: noteText,
        changedBy: employeeName,
        timestamp: new Date(),
      });
    } else if (body.statusNote?.trim()) {
      // Just adding a progress note without changing status
      enquiry.statusHistory.push({
        status: enquiry.status,
        notes: body.statusNote.trim(),
        changedBy: employeeName,
        timestamp: new Date(),
      });
    }

    // Editable fields
    if (body.customerName !== undefined) enquiry.customerName = body.customerName.trim();
    if (body.customerPhone !== undefined) enquiry.customerPhone = body.customerPhone.trim();
    if (body.customerEmail !== undefined) enquiry.customerEmail = body.customerEmail.trim();
    if (body.productName !== undefined) enquiry.productName = body.productName.trim();
    if (body.brandName !== undefined) enquiry.brandName = body.brandName.trim();
    if (body.categoryName !== undefined) enquiry.categoryName = body.categoryName.trim();
    if (body.quantity !== undefined) enquiry.quantity = Number(body.quantity);
    if (body.targetPrice !== undefined) enquiry.targetPrice = Number(body.targetPrice);
    if (body.advancePaid !== undefined) enquiry.advancePaid = Number(body.advancePaid);
    if (body.customerNotes !== undefined) enquiry.customerNotes = body.customerNotes.trim();
    if (body.supplierName !== undefined) enquiry.supplierName = body.supplierName.trim();
    if (body.supplierOrderRef !== undefined) enquiry.supplierOrderRef = body.supplierOrderRef.trim();

    enquiry.lastUpdatedBy = employeeName;
    await enquiry.save();

    return NextResponse.json({
      message: 'Enquiry updated successfully',
      enquiry,
    });
  } catch (error) {
    console.error('Error updating enquiry:', error);
    return NextResponse.json(
      { error: 'Failed to update enquiry', details: error.message },
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

    const deleted = await Enquiry.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ error: 'Enquiry not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Enquiry removed successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete enquiry', details: error.message },
      { status: 500 }
    );
  }
}
