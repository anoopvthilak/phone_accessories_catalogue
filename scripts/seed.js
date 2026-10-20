import { ensureDefaultUsers } from '../src/lib/seedAdmin.js';
import mongoose from 'mongoose';

async function main() {
  try {
    console.log('Seeding initial users...');
    await ensureDefaultUsers();
    console.log('Seeding completed successfully.');
  } catch (error) {
    console.error('Seeding error:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

main();
