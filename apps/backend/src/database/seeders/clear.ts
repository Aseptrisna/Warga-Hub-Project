import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/wargahub';

async function clearDatabase() {
  const client = new MongoClient(MONGODB_URI);

  try {
    console.log('🚀 Connecting to MongoDB...');
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    console.log('🗑️  Clearing database...');
    await client.db().dropDatabase();
    console.log('✅ Database cleared!\n');

    await client.close();
    console.log('✅ Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Clear database error:', error);
    await client.close();
    process.exit(1);
  }
}

clearDatabase();
