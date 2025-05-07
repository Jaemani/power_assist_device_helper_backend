import { MongoClient } from 'mongodb';

const uri = "mongodb+srv://"+process.env.MONGO_USERNAME+":"+process.env.MONGO_PASSWORD+"@"+process.env.MONGO_CLUSTER_URL;
const dbName = process.env.MONGO_DB_NAME;

if (!uri || !dbName) {
  throw new Error('Missing MONGODB_URI or MONGODB_DBNAME in .env');
}

const options = {};
let client;
let clientPromise;

if (!global._mongoClientPromise) {
  client = new MongoClient(uri, options);
  global._mongoClientPromise = client.connect().then((client) => {
    console.log(`✅ MongoDB connected to "${dbName}"`);
    return client;
  }).catch((err) => {
    console.error('❌ MongoDB connection failed:', err);
    throw err;
  });
}

clientPromise = global._mongoClientPromise;

export async function getDb() {
  const client = await clientPromise;
  return client.db(dbName);
}
