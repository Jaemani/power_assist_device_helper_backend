import initializeFirebaseAdmin from '@/lib/firebaseAdmin';
import connectToMongoose from '@/lib/db/connect';
import { getAuth } from 'firebase-admin/auth';
import { Repairs, Users, Vehicles } from '@/lib/db/models';
import { NextResponse } from 'next/server';

await connectToMongoose();
await initializeFirebaseAdmin();

export async function GET(req, { params }) {
  if (!req.headers.get('authorization')) return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 });
  const token = req.headers.get('authorization').split("Bearer ")[1]; // Extract the token from the header
  if (!token) return NextResponse.json({ error: 'Missing firebase token' }, { status: 400 });
  
  let firebaseUid;
  try {
    const decoded = await getAuth().verifytoken(token);
    console.log('Decoded token:', decoded);
    firebaseUid = decoded.user_id;

  } catch (error) {
      console.error('Error verifying ID token:', error);
      return NextResponse.json({ error: 'Invalid ID token' }, { status: 401 });
  } 
  
  const userDoc = await Users.findOne({ firebaseUid }).lean();
  if (!userDoc) {
    return NextResponse.json({ error: 'Unauthorized: no such user' }, { status: 401 });
  }

  const { vehicleId } = params;
  if (!vehicleId) {
    return NextResponse.json({ error: 'Missing vehicleId' }, { status: 400 });
  }

  const vehicleDoc = await Vehicles.findOne({ vehicleId }).lean();
  if (!vehicleDoc) {
    return NextResponse.json({ error: 'Invalid vehicleId' }, { status: 400 });
  }

  if (!userDoc.vehicleIds?.map(id => id.toString()).includes(vehicleDoc._id.toString())) {
    return NextResponse.json({ error: 'Forbidden: not the vehicle owner' }, { status: 403 });
  }

  const repairs = await Repairs.find({ vehicleId: vehicleDoc._id })
    .sort({ repairedDate: -1 })
    .lean();

  return NextResponse.json(repairs);
}

export async function POST(req, { params }) {
  await connectToMongoose();
  const decoded = await verifytoken(req);
  if (decoded instanceof Response) return decoded;

  const userDoc = await Users.findOne({ firebaseUid: decoded.uid }).lean();
  if (!userDoc) {
    return NextResponse.json({ error: 'Unauthorized: no such user' }, { status: 401 });
  }

  const { vehicleId } = params;
  if (!vehicleId) {
    return NextResponse.json({ error: 'Missing vehicleId' }, { status: 400 });
  }

  const vehicleDoc = await Vehicles.findOne({ vehicleId }).lean();
  if (!vehicleDoc) {
    return NextResponse.json({ error: 'Invalid vehicleId' }, { status: 400 });
  }

  if (!userDoc.vehicleIds?.map(id => id.toString()).includes(vehicleDoc._id.toString())) {
    return NextResponse.json({ error: 'Forbidden: not the vehicle owner' }, { status: 403 });
  }

  const {
    repairedDate,
    billingPrice,
    isAccident,
    repairCategories,
    batteryVoltage,
    etcRepairParts,
    memo,
    repairer
  } = await req.json();

  if (
    !repairedDate ||
    typeof billingPrice !== 'number' ||
    typeof isAccident !== 'boolean' ||
    !Array.isArray(repairCategories) ||
    typeof batteryVoltage !== 'number' ||
    (repairCategories.includes('기타') && !etcRepairParts) ||
    typeof repairer !== 'string'
  ) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  try {
    const newRepair = await Repairs.create({
      vehicleId: vehicleDoc._id,
      repairer,
      repairStationCode: userDoc.stationCode,
      repairStationLabel: userDoc.stationLabel,
      repairedDate: new Date(repairedDate),
      billingPrice,
      isAccident,
      repairCategories,
      batteryVoltage,
      etcRepairParts,
      memo
    });
    return NextResponse.json(newRepair, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Error creating repair' }, { status: 500 });
  }
}
