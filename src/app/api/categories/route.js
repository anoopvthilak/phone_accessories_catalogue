import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb.js';
import Category from '@/models/Category.js';

export async function GET() {
  try {
    await connectDB();
    const categories = await Category.find({ isActive: true })
      .sort({ displayOrder: 1, name: 1 })
      .lean();

    return NextResponse.json({ success: true, categories });
  } catch (error) {
    console.error('Categories fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}
