// db/connect.js
import mongoose from 'mongoose';

const uri = `mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_CLUSTER_URL}/${process.env.MONGO_DB_NAME}?retryWrites=true&w=majority&appName=Cluster0`;

if (!uri) throw new Error('Missing MongoDB connection URI');

let cached = global.mongoose || { conn: null, promise: null };

async function connectToMongoose() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000, // ⏱ fallback for connection hang
    }).then((mongooseInstance) => {
      console.log('✅ Mongoose connected to', mongooseInstance.connection.name);
      return mongooseInstance;
    }).catch((err) => {
      console.error('❌ Mongoose connection failed:', err.message);
      throw err;
    });
  }

  cached.conn = await cached.promise;
  global.mongoose = cached;

  return cached.conn;
}

export default connectToMongoose;