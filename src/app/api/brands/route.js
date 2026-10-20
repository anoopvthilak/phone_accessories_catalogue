import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb.js';
import Brand from '@/models/Brand.js';

export async function GET() {
  try {
    await connectDB();
    const brands = await Brand.find({ isActive: true })
      .sort({ name: 1 })
      .lean();

    return NextResponse.json({ success: true, brands });
  } catch (error) {
    console.error('Brands fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch brands' },
      { status: 500 }
    );
  }
}
