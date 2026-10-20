import connectDB from '../src/lib/mongodb.js';
import Product from '../src/models/Product.js';
import Category from '../src/models/Category.js';
import Brand from '../src/models/Brand.js';
import mongoose from 'mongoose';

async function benchmark() {
  await connectDB();

  console.log('--- STARTING 10,000 PRODUCTS SEARCH BENCHMARK ---');

  const count = await Product.countDocuments();
  console.log(`Current products in DB: ${count}`);

  if (count < 10000) {
    const needed = 10000 - count;
    console.log(`Seeding ${needed} additional realistic phone accessories products...`);

    const categories = await Category.find();
    const brands = await Brand.find();

    const catList = categories.length > 0 ? categories : [
      { _id: new mongoose.Types.ObjectId(), name: 'Chargers' },
      { _id: new mongoose.Types.ObjectId(), name: 'USB Cables' },
      { _id: new mongoose.Types.ObjectId(), name: 'Mobile Covers' },
      { _id: new mongoose.Types.ObjectId(), name: 'Tempered Glass' },
      { _id: new mongoose.Types.ObjectId(), name: 'Power Banks' },
      { _id: new mongoose.Types.ObjectId(), name: 'Earphones' },
    ];

    const brandList = brands.length > 0 ? brands : [
      { _id: new mongoose.Types.ObjectId(), name: 'Anker' },
      { _id: new mongoose.Types.ObjectId(), name: 'Spigen' },
      { _id: new mongoose.Types.ObjectId(), name: 'Apple' },
      { _id: new mongoose.Types.ObjectId(), name: 'Samsung' },
      { _id: new mongoose.Types.ObjectId(), name: 'Belkin' },
      { _id: new mongoose.Types.ObjectId(), name: 'boAt' },
    ];

    const devices = [
      'iPhone 16 Pro Max', 'iPhone 16 Pro', 'iPhone 16', 'iPhone 15 Pro',
      'iPhone 15', 'Galaxy S24 Ultra', 'Galaxy S24', 'Galaxy S23',
      'OnePlus 12', 'Pixel 9 Pro', 'iPad Air M2', 'Universal USB-C',
    ];

    const adjectives = ['Ultra-Fast', 'Rugged Armor', 'Magnetic Slim', 'Braided HD', 'Compact GaN', 'Titanium Shield', 'Wireless Qi2', 'Pure Audio'];
    const types = ['Fast Charger', 'Type-C Cable', 'Protective Case', 'Edge-to-Edge Glass', 'Portable Power Bank', 'ANC Earbuds'];

    const batchSize = 1000;
    for (let b = 0; b < Math.ceil(needed / batchSize); b++) {
      const docs = [];
      const currentBatch = Math.min(batchSize, needed - b * batchSize);
      for (let i = 0; i < currentBatch; i++) {
        const itemIdx = b * batchSize + i + count;
        const brand = brandList[itemIdx % brandList.length];
        const category = catList[itemIdx % catList.length];
        const adj = adjectives[itemIdx % adjectives.length];
        const typ = types[itemIdx % types.length];
        const device = devices[itemIdx % devices.length];

        const name = `${brand.name} ${adj} ${typ} for ${device} #${itemIdx}`;
        const sku = `${brand.name.slice(0, 3).toUpperCase()}-${category.name.slice(0, 3).toUpperCase()}-${itemIdx}`;
        const price = 499 + (itemIdx % 50) * 100;
        const mrp = price + 300 + (itemIdx % 10) * 50;

        docs.push({
          name,
          category: category._id,
          categoryName: category.name,
          brand: brand._id,
          brandName: brand.name,
          sku,
          price,
          mrp,
          images: ['https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=800&q=80'],
          description: `High performance ${name} engineered with premium materials for maximum durability.`,
          specifications: { 'Model Year': '2026', 'Color': 'Matte Black' },
          compatibility: [device, 'Universal USB-C'],
          warranty: '1 Year Warranty',
          stock: (itemIdx % 20) + 1,
          inStock: true,
          status: 'ACTIVE',
        });
      }
      await Product.insertMany(docs);
      process.stdout.write(`Inserted ${b * batchSize + docs.length}/${needed} products...\r`);
    }
    console.log('\nSeeding completed!');
  }

  const totalCount = await Product.countDocuments();
  console.log(`Total catalogue products in DB: ${totalCount}`);

  // Test queries across:
  // 1. Product Name
  // 2. SKU
  // 3. Brand
  // 4. Category
  // 5. Compatibility
  const testTerms = [
    { label: 'Product Name search ("Charger")', term: 'Charger' },
    { label: 'SKU exact search ("ANK-CHA-100")', term: 'ANK-CHA-100' },
    { label: 'Brand search ("Spigen")', term: 'Spigen' },
    { label: 'Category search ("Mobile Covers")', term: 'Mobile Covers' },
    { label: 'Compatibility search ("Galaxy S24 Ultra")', term: 'Galaxy S24 Ultra' },
  ];

  console.log('\n--- BENCHMARK RESULTS ---');
  for (const { label, term } of testTerms) {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const query = {
      status: { $ne: 'ARCHIVED' },
      $or: [
        { $text: { $search: term } },
        { name: { $regex: escaped, $options: 'i' } },
        { sku: { $regex: `^${escaped}`, $options: 'i' } },
        { sku: { $regex: escaped, $options: 'i' } },
        { brandName: { $regex: escaped, $options: 'i' } },
        { categoryName: { $regex: escaped, $options: 'i' } },
        { compatibility: { $elemMatch: { $regex: escaped, $options: 'i' } } },
      ],
    };

    const start = performance.now();
    const results = await Product.find(query).limit(12).lean();
    const elapsed = (performance.now() - start).toFixed(2);
    console.log(`✓ ${label}: ${elapsed}ms (Matched: ${results.length} sample results)`);
  }

  await mongoose.disconnect();
  console.log('Benchmark finished.');
  process.exit(0);
}

benchmark().catch(err => {
  console.error('Benchmark failed:', err);
  process.exit(1);
});
