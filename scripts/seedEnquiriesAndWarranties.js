import connectDB from '../src/lib/mongodb.js';
import Enquiry from '../src/models/Enquiry.js';
import WarrantyClaim from '../src/models/WarrantyClaim.js';
import Product from '../src/models/Product.js';
import mongoose from 'mongoose';

async function seedData() {
  await connectDB();

  const countEnquiries = await Enquiry.countDocuments();
  if (countEnquiries === 0) {
    console.log('Seeding sample Customer Enquiries...');

    const products = await Product.find().limit(3);

    await Enquiry.create([
      {
        enquiryNumber: 'ENQ-2410-1011',
        customerName: 'Rahul Verma',
        customerPhone: '9876543210',
        customerEmail: 'rahul.v@gmail.com',
        productType: 'EXISTING_PRODUCT',
        product: products[0]?._id || null,
        productName: products[0]?.name || 'Anker 65W GaN Fast Charger 3-Port',
        categoryName: 'Chargers',
        brandName: 'Anker',
        quantity: 1,
        targetPrice: 2499,
        advancePaid: 500,
        customerNotes: 'Customer needs black color model, urgent before Saturday trip',
        status: 'DELIVERED',
        supplierName: 'Supreme Distributor',
        supplierOrderRef: 'SUP-9921',
        createdBy: 'Sales Staff',
        statusHistory: [
          {
            status: 'ENQUIRED',
            notes: 'Customer asked for out-of-stock 65W GaN Charger. Advance 500 collected.',
            changedBy: 'Sales Staff',
            timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          },
          {
            status: 'ORDERED',
            notes: 'Placed order with Supreme Distributor PO# SUP-9921',
            changedBy: 'Store Admin',
            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          },
          {
            status: 'ON_THE_WAY',
            notes: 'Shipped via Express Logistics tracking #EX78129',
            changedBy: 'Store Admin',
            timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          },
          {
            status: 'DELIVERED',
            notes: 'Stock arrived at store counter. Ready to notify customer.',
            changedBy: 'Sales Staff',
            timestamp: new Date(),
          },
        ],
      },
      {
        enquiryNumber: 'ENQ-2410-1012',
        customerName: 'Priya Sharma',
        customerPhone: '9812345678',
        customerEmail: 'priya.s@yahoo.com',
        productType: 'NEW_CUSTOM_ITEM',
        productName: 'Spigen Ultra Hybrid MagSafe Case for iPhone 16 Pro Max',
        categoryName: 'Mobile Covers',
        brandName: 'Spigen',
        quantity: 1,
        targetPrice: 1999,
        advancePaid: 1000,
        customerNotes: 'Matte Frost Black finish preferred with MagFit ring',
        status: 'ORDERED',
        supplierName: 'Spigen India Direct',
        supplierOrderRef: 'SPG-4811',
        createdBy: 'Store Admin',
        statusHistory: [
          {
            status: 'ENQUIRED',
            notes: 'Customer requested new accessory not yet introduced in catalogue',
            changedBy: 'Sales Staff',
            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          },
          {
            status: 'ORDERED',
            notes: 'Batch order placed with Spigen India distributor',
            changedBy: 'Store Admin',
            timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          },
        ],
      },
      {
        enquiryNumber: 'ENQ-2410-1013',
        customerName: 'Amit Patel',
        customerPhone: '9723456789',
        productType: 'NEW_CUSTOM_ITEM',
        productName: 'Baseus 100W 20000mAh Blade Power Bank Slim Laptop Charger',
        categoryName: 'Power Banks',
        brandName: 'Baseus',
        quantity: 2,
        targetPrice: 4200,
        advancePaid: 2000,
        customerNotes: 'Needs 100W PD output for MacBook Pro',
        status: 'ENQUIRED',
        createdBy: 'Sales Staff',
        statusHistory: [
          {
            status: 'ENQUIRED',
            notes: 'Customer looking for high wattage slim power bank',
            changedBy: 'Sales Staff',
            timestamp: new Date(),
          },
        ],
      },
      {
        enquiryNumber: 'ENQ-2410-1014',
        customerName: 'Sneha Kulkarni',
        customerPhone: '9654321098',
        productType: 'EXISTING_PRODUCT',
        productName: 'boAt Rockerz 255 Pro+ Neckband (Active Black)',
        categoryName: 'Earphones',
        brandName: 'boAt',
        quantity: 1,
        targetPrice: 1299,
        advancePaid: 0,
        status: 'COMPLETED',
        createdBy: 'Sales Staff',
        statusHistory: [
          {
            status: 'ENQUIRED',
            notes: 'Customer requested black color variant',
            changedBy: 'Sales Staff',
            timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          },
          {
            status: 'DELIVERED',
            notes: 'Arrived at shop',
            changedBy: 'Sales Staff',
            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          },
          {
            status: 'NOTIFIED',
            notes: 'Customer called and confirmed pickup',
            changedBy: 'Sales Staff',
            timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          },
          {
            status: 'COMPLETED',
            notes: 'Product collected, payment completed in full (Selled).',
            changedBy: 'Sales Staff',
            timestamp: new Date(),
          },
        ],
      },
    ]);
    console.log('Customer Enquiries seeded successfully.');
  }

  const countWarranties = await WarrantyClaim.countDocuments();
  if (countWarranties === 0) {
    console.log('Seeding sample Warranty Claims...');

    await WarrantyClaim.create([
      {
        ticketNumber: 'WRN-2410-4821',
        customerName: 'Vikram Singh',
        customerPhone: '9820011223',
        customerEmail: 'vikram.singh@gmail.com',
        productName: 'boAt Airdopes 141 ANC True Wireless Earbuds',
        brandName: 'boAt',
        categoryName: 'Earphones',
        serialNumber: 'BT-AD141-89218',
        billNumber: 'INV-2024-8842',
        purchaseDate: new Date('2024-06-15'),
        warrantyType: 'Brand Warranty',
        issueDescription: 'Left earbud volume very low and cutting off intermittently. Right earbud works fine.',
        physicalCondition: 'Good condition, no water damage, clean contacts',
        accessoriesIncluded: 'Charging case, Type-C cable, original box',
        status: 'SENT_TO_SERVICE_CENTER',
        serviceCenterName: 'boAt Authorized Regional RMA Hub, Andheri',
        serviceCenterRmaNo: 'BOAT-RMA-90412',
        receivedBy: 'Sales Staff',
        statusHistory: [
          {
            status: 'RECEIVED_AT_SHOP',
            notes: 'Customer submitted product at shop counter with bill copy.',
            updatedBy: 'Sales Staff',
            timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
          },
          {
            status: 'SENT_TO_SERVICE_CENTER',
            notes: 'Sent via BlueDart docket #BL99210 to boAt Authorized Service Center Mumbai.',
            updatedBy: 'Store Admin',
            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          },
        ],
      },
      {
        ticketNumber: 'WRN-2410-4822',
        customerName: 'Ananya Roy',
        customerPhone: '9833445566',
        productName: 'Apple 20W USB-C Power Adapter (Original)',
        brandName: 'Apple',
        categoryName: 'Chargers',
        serialNumber: 'C4H781299KL',
        billNumber: 'BILL-49210',
        purchaseDate: new Date('2024-03-10'),
        warrantyType: 'Brand Warranty',
        issueDescription: 'Completely dead, not charging any phone. No physical or pin damage.',
        physicalCondition: 'Mint condition, original box provided',
        accessoriesIncluded: 'Adapter only with warranty card',
        status: 'RECEIVED_BACK_AT_SHOP',
        serviceCenterName: 'Apple Authorized Service Provider (Brio)',
        serviceCenterRmaNo: 'APL-SR-55120',
        receivedBy: 'Sales Staff',
        statusHistory: [
          {
            status: 'RECEIVED_AT_SHOP',
            notes: 'Intake at counter',
            updatedBy: 'Sales Staff',
            timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
          },
          {
            status: 'SENT_TO_SERVICE_CENTER',
            notes: 'Submitted to Apple Authorized Service Provider',
            updatedBy: 'Store Admin',
            timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
          },
          {
            status: 'REPLACED_OR_REPAIRED',
            notes: 'Apple approved warranty replacement. Brand new sealed unit issued (New Serial: C4H992014PP).',
            updatedBy: 'Store Admin',
            timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          },
          {
            status: 'RECEIVED_BACK_AT_SHOP',
            notes: 'Replacement unit received back at shop counter. Ready for customer pickup!',
            updatedBy: 'Sales Staff',
            timestamp: new Date(),
          },
        ],
      },
      {
        ticketNumber: 'WRN-2410-4823',
        customerName: 'Deepak Joshi',
        customerPhone: '9711223344',
        productName: 'Portronics Konnect Pro 60W Braided Cable 1.5m',
        brandName: 'Portronics',
        categoryName: 'USB Cables',
        billNumber: 'BILL-1992',
        warrantyType: 'Shop Warranty',
        issueDescription: 'Loose connection near Type-C connector head',
        physicalCondition: 'Braiding intact, minor bend',
        status: 'RECEIVED_AT_SHOP',
        receivedBy: 'Sales Staff',
        statusHistory: [
          {
            status: 'RECEIVED_AT_SHOP',
            notes: 'Received under 6-month shop warranty. To be tested by technician.',
            updatedBy: 'Sales Staff',
            timestamp: new Date(),
          },
        ],
      },
    ]);
    console.log('Warranty Claims seeded successfully.');
  }

  await mongoose.disconnect();
}

seedData()
  .then(() => {
    console.log('Seeding completed successfully.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Seeding error:', err);
    process.exit(1);
  });
