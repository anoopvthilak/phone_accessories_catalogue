import connectDB from './mongodb.js';
import User from '../models/User.js';
import Category from '../models/Category.js';
import Brand from '../models/Brand.js';
import Product from '../models/Product.js';
import { hashPassword } from './auth.js';

export async function ensureDefaultUsers() {
  await connectDB();

  // 1. Seed Users
  const adminExists = await User.findOne({ username: 'admin' });
  if (!adminExists) {
    const hashedPassword = await hashPassword('Admin@123');
    await User.create({
      name: 'Store Administrator',
      username: 'admin',
      email: 'admin@gmail.com',
      password: hashedPassword,
      role: 'ADMIN',
      isActive: true,
    });
    console.log('[Seed] Created default ADMIN user: admin / Admin@123');
  }

  const staffExists = await User.findOne({ username: 'staff' });
  if (!staffExists) {
    const hashedPassword = await hashPassword('Staff@123');
    await User.create({
      name: 'Sales Staff',
      username: 'staff',
      email: 'staff@gmail.com',
      password: hashedPassword,
      role: 'STAFF',
      isActive: true,
    });
    console.log('[Seed] Created default STAFF user: staff / Staff@123');
  }

  // 2. Seed Categories
  const categoryDefs = [
    { name: 'Chargers', slug: 'chargers', displayOrder: 1 },
    { name: 'USB Cables', slug: 'usb-cables', displayOrder: 2 },
    { name: 'Mobile Covers', slug: 'mobile-covers', displayOrder: 3 },
    { name: 'Tempered Glass', slug: 'tempered-glass', displayOrder: 4 },
    { name: 'Earphones', slug: 'earphones', displayOrder: 5 },
    { name: 'Bluetooth Speakers', slug: 'bluetooth-speakers', displayOrder: 6 },
    { name: 'Power Banks', slug: 'power-banks', displayOrder: 7 },
    { name: 'Adapters', slug: 'adapters', displayOrder: 8 },
    { name: 'Mobile Stands', slug: 'mobile-stands', displayOrder: 9 },
    { name: 'Smart Watches', slug: 'smart-watches', displayOrder: 10 },
  ];

  const categoryMap = {};
  for (const cat of categoryDefs) {
    let existing = await Category.findOne({ slug: cat.slug });
    if (!existing) {
      existing = await Category.create(cat);
    }
    categoryMap[cat.name] = existing;
  }

  // 3. Seed Brands
  const brandDefs = [
    { name: 'Apple', slug: 'apple' },
    { name: 'Samsung', slug: 'samsung' },
    { name: 'Anker', slug: 'anker' },
    { name: 'Spigen', slug: 'spigen' },
    { name: 'boAt', slug: 'boat' },
    { name: 'Belkin', slug: 'belkin' },
    { name: 'OnePlus', slug: 'oneplus' },
  ];

  const brandMap = {};
  for (const br of brandDefs) {
    let existing = await Brand.findOne({ slug: br.slug });
    if (!existing) {
      existing = await Brand.create(br);
    }
    brandMap[br.name] = existing;
  }

  // 4. Seed Products if empty
  const productCount = await Product.countDocuments();
  if (productCount === 0) {
    const sampleProducts = [
      {
        name: 'Anker Prime 67W GaN Wall Charger 3-Port',
        category: categoryMap['Chargers']?._id,
        categoryName: 'Chargers',
        brand: brandMap['Anker']?._id,
        brandName: 'Anker',
        price: 3499,
        mrp: 4999,
        images: ['https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=800&q=80'],
        description: 'Ultra-compact 67W high-speed GaN charger with 2 USB-C and 1 USB-A ports. Features ActiveShield 2.0 temperature monitoring.',
        specifications: { 'Total Output': '67W Max', 'Technology': 'GaN Prime', 'Ports': '2x USB-C, 1x USB-A' },
        compatibility: ['MacBook Pro', 'iPhone 15 / 16', 'Galaxy S24', 'iPad Pro', 'Universal USB-C'],
        warranty: '18 Months Replacement Warranty',
        stock: 35,
        status: 'ACTIVE',
        featured: true,
      },
      {
        name: 'Spigen Ultra Hybrid Matte Frost Case - iPhone 15 Pro',
        category: categoryMap['Mobile Covers']?._id,
        categoryName: 'Mobile Covers',
        brand: brandMap['Spigen']?._id,
        brandName: 'Spigen',
        price: 1599,
        mrp: 2199,
        images: ['https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?auto=format&fit=crop&w=800&q=80'],
        description: 'Crystal clear back with shock-absorbing TPU bumper. Raised bezels lift screen and camera off flat surfaces with tactile button covers.',
        specifications: { 'Material': 'Polycarbonate + TPU', 'Profile': 'Slim Drop Protection', 'Air Cushion': 'Certified Military Grade' },
        compatibility: ['iPhone 15 Pro'],
        warranty: '6 Months Manufacturer Warranty',
        stock: 48,
        status: 'ACTIVE',
        featured: true,
      },
      {
        name: 'Apple 20W USB-C Power Adapter',
        category: categoryMap['Chargers']?._id,
        categoryName: 'Chargers',
        brand: brandMap['Apple']?._id,
        brandName: 'Apple',
        price: 1899,
        mrp: 1900,
        images: ['https://images.unsplash.com/photo-1618519764620-7403abdbdfe9?auto=format&fit=crop&w=800&q=80'],
        description: 'Genuine Apple 20W USB-C Power Adapter offers fast, efficient charging at home, in the office, or on the go.',
        specifications: { 'Output': '20W Power Delivery', 'Connector': 'USB-C', 'Color': 'White' },
        compatibility: ['iPhone 12/13/14/15/16', 'iPad Air', 'Apple Watch Fast Charger'],
        warranty: '1 Year Apple Official Warranty',
        stock: 65,
        status: 'ACTIVE',
        featured: true,
      },
      {
        name: 'boAt Airdopes 141 ANC True Wireless Earbuds',
        category: categoryMap['Earphones']?._id,
        categoryName: 'Earphones',
        brand: brandMap['boAt']?._id,
        brandName: 'boAt',
        price: 1799,
        mrp: 5990,
        images: ['https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80'],
        description: 'Active Noise Cancellation up to 32dB with 42 hours total playback, ENx Technology quad mics, and BEAST mode low latency gaming.',
        specifications: { 'Battery Life': '42 Hours Playback', 'Driver': '10mm Dynamic Drivers', 'Latency': '50ms Low Latency' },
        compatibility: ['Android', 'iOS', 'Windows', 'Mac', 'Bluetooth 5.3'],
        warranty: '1 Year boAt Replacement Warranty',
        stock: 28,
        status: 'ACTIVE',
        featured: true,
      },
      {
        name: 'Anker 310 USB-C to USB-C Braided Cable 6ft',
        category: categoryMap['USB Cables']?._id,
        categoryName: 'USB Cables',
        brand: brandMap['Anker']?._id,
        brandName: 'Anker',
        price: 899,
        mrp: 1299,
        images: ['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80'],
        description: 'Heavy-duty double-braided nylon cable tested to withstand 10,000+ bends. Supports up to 60W USB-PD fast charging.',
        specifications: { 'Length': '1.8m (6 ft)', 'Max Wattage': '60W PD', 'Outer Material': 'Braided Nylon' },
        compatibility: ['iPhone 15 / 16', 'iPad Pro', 'MacBook Air', 'Galaxy S24 / Note', 'Universal USB-C'],
        warranty: '24 Months Anker Warranty',
        stock: 75,
        status: 'ACTIVE',
        featured: false,
      },
      {
        name: 'Belkin BoostCharge Magnetic Wireless Power Bank 5K',
        category: categoryMap['Power Banks']?._id,
        categoryName: 'Power Banks',
        brand: brandMap['Belkin']?._id,
        brandName: 'Belkin',
        price: 2999,
        mrp: 4499,
        images: ['https://images.unsplash.com/photo-1609592807664-42b78b8719f2?auto=format&fit=crop&w=800&q=80'],
        description: 'MagSafe-compatible 5,000mAh magnetic power bank with integrated fold-out stand for hands-free video viewing while charging.',
        specifications: { 'Capacity': '5,000 mAh', 'Wireless Charging': '7.5W Qi MagSafe', 'Pass-Through': 'Supported' },
        compatibility: ['iPhone 12', 'iPhone 13', 'iPhone 14', 'iPhone 15', 'iPhone 16'],
        warranty: '2 Year Connected Equipment Warranty',
        stock: 19,
        status: 'ACTIVE',
        featured: true,
      },
      {
        name: 'Samsung 45W Super Fast Charger 2.0 with 5A Cable',
        category: categoryMap['Chargers']?._id,
        categoryName: 'Chargers',
        brand: brandMap['Samsung']?._id,
        brandName: 'Samsung',
        price: 2799,
        mrp: 3999,
        images: ['https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=800&q=80'],
        description: 'Official Samsung 45W Power Delivery adapter engineered specifically for Galaxy S24 Ultra, S23+, and Galaxy Tab devices.',
        specifications: { 'Wattage': '45W Max', 'Protocol': 'USB-PD 3.0 PPS', 'Included': '5A USB-C Cable' },
        compatibility: ['Galaxy S24 Ultra / Plus', 'Galaxy S23 Ultra', 'Galaxy Tab S9', 'Note 20'],
        warranty: '1 Year Samsung Warranty',
        stock: 22,
        status: 'ACTIVE',
        featured: false,
      },
      {
        name: 'Spigen Glas.tR EZ Fit Tempered Glass for iPhone 15 Pro (2-Pack)',
        category: categoryMap['Tempered Glass']?._id,
        categoryName: 'Tempered Glass',
        brand: brandMap['Spigen']?._id,
        brandName: 'Spigen',
        price: 1199,
        mrp: 1799,
        images: ['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80'],
        description: 'Auto-alignment installation kit included for effortless zero-bubble installation. 9H hardness tempered glass with oleophobic anti-fingerprint coating.',
        specifications: { 'Hardness': '9H Diamond Grade', 'Quantity': '2 Glass Screen Protectors', 'Alignment Tray': 'EZ Fit Included' },
        compatibility: ['iPhone 15 Pro', 'iPhone 15 Pro Max'],
        warranty: '6 Months Manufacturer Warranty',
        stock: 90,
        status: 'ACTIVE',
        featured: false,
      },
      {
        name: 'OnePlus Warp Charge 65W Power Adapter',
        category: categoryMap['Chargers']?._id,
        categoryName: 'Chargers',
        brand: brandMap['OnePlus']?._id,
        brandName: 'OnePlus',
        price: 1999,
        mrp: 2499,
        images: ['https://images.unsplash.com/photo-1618519764620-7403abdbdfe9?auto=format&fit=crop&w=800&q=80'],
        description: 'Direct charge technology delivers 65W charging speeds while keeping the phone cool. Backward compatible with all previous Warp / Dash models.',
        specifications: { 'Technology': 'Warp / SuperVOOC', 'Output': '65W Max', 'Protection': '10-Layer Safety Protection' },
        compatibility: ['OnePlus 12 / 11 / 10 / 9 / 8', 'Nord Series', 'PD Compatible Devices'],
        warranty: '1 Year Brand Warranty',
        stock: 0,
        status: 'OUT_OF_STOCK',
        featured: false,
      },
    ];

    await Product.insertMany(sampleProducts);
    console.log(`[Seed] Seeded ${sampleProducts.length} accessories products`);
  }
}
