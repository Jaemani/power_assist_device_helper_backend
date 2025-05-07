// /lib/db/models.js
import { getDb } from './connect';
import { ObjectId } from 'mongodb';

let initialized = false;

export async function initCollections() { // MongoDB initialization
  if (initialized) return;
  const db = await getDb();

  const users = db.collection('users');
  const vehicles = db.collection('vehicles');
  const guardians = db.collection('guardians');

  // Setup unique indexes
  await users.createIndex({ firebaseUid: 1 }, { unique: true });
  await vehicles.createIndex({ vehicleId: 1 }, { unique: true });
  await guardians.createIndex({ firebaseUid: 1 }, { unique: true });

  console.log('✅ Indexes ensured for users, vehicles, and guardians');
  // 성현님 다른 collection도 추가해주시면 돼요!
  initialized = true;
}

export async function getUsersCollection() {
  await initCollections();
  const db = await getDb();
  return db.collection('users');
}

export async function getVehiclesCollection() {
  await initCollections();
  const db = await getDb();
  return db.collection('vehicles');
}

export async function getGuardiansCollection() {
  await initCollections();
  const db = await getDb();
  return db.collection('guardians');
}

// Example helper
export async function findUserByFirebaseUid(firebaseUid) {
  const users = await getUsersCollection();
  return users.findOne({ firebaseUid });
}

export { ObjectId };
