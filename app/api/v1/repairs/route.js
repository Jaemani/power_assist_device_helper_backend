import connectToMongoose from '@/lib/db/connect';
import mongoose from 'mongoose';
import admin from '@/lib/firebaseAdmin';
import { Repairs, Users, Vehicles } from '@/lib/db/models';
import { NextResponse } from 'next/server';

async function verifytoken(req) {
  const auth = req.headers.get('authorization') || '';
  if (!auth.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Missing or invalid Authorization header' }, { status: 401 });
  }
  const token = auth.split(' ')[1];
  try {
    return await admin.auth().verifytoken(token);
  } catch {
    return NextResponse.json({ error: 'Invalid ID token' }, { status: 401 });
  }
}

export async function GET(req, { params }) {
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
