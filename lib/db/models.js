import { getDb } from './connect';
import { ObjectId } from 'mongodb';

let initialized = false;

export async function initCollections() { // MongoDB initialization
  if (initialized) return;
  const db = await getDb();

  const users = db.collection('users');
  const vehicles = db.collection('vehicles');
  const guardians = db.collection('guardians');
  const repairInfo = db.collection('repairInfo');
  const repairStation = db.collection('repairStation');

  // Setup unique indexes
  await users.createIndex({ firebaseUid: 1 }, { unique: true });
  await vehicles.createIndex({ vehicleId: 1 }, { unique: true });
  await guardians.createIndex({ firebaseUid: 1 }, { unique: true });
  
  console.log('✅ Indexes ensured for collections');
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

export async function getRepairInfoCollection() {
  await initCollections();
  const db = await getDb();
  return db.collection('repairInfo');
}

export async function getRepairStationCollection() {
  await initCollections();
  const db = await getDb();
  return db.collection('repairStation');
}

export { ObjectId };
