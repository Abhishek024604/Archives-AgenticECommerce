import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const migrate = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    
    // Update shoes -> footwear
    const res1 = await db.collection('products').updateMany(
      { category: 'shoes' },
      { $set: { category: 'footwear' } }
    );
    console.log(`Updated ${res1.modifiedCount} products from shoes to footwear.`);

    // Update lifestyle and home -> home & lifestyle
    const res2 = await db.collection('products').updateMany(
      { category: { $in: ['lifestyle', 'home'] } },
      { $set: { category: 'home & lifestyle' } }
    );
    console.log(`Updated ${res2.modifiedCount} products from lifestyle/home to home & lifestyle.`);

    await mongoose.disconnect();
    console.log('Done.');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrate();
