import connectToMongoose from '@/lib/db/connect';
import mongoose from 'mongoose';
import admin from '@/lib/firebaseAdmin';
import { Repair, User } from '@/lib/db/models';
import { NextResponse } from 'next/server';

async function verifyIdToken(req) {
  const auth = req.headers.get('authorization') || '';
  if (!auth.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Missing or invalid Authorization header' }, { status: 401 });
  }
  const idToken = auth.split(' ')[1];
  try {
    return await admin.auth().verifyIdToken(idToken);
  } catch {
    return NextResponse.json({ error: 'Invalid ID token' }, { status: 401 });
  }
}

export async function GET(req) {
  await connectToMongoose();
  const decoded = await verifyIdToken(req);
  if (decoded instanceof Response) return decoded;
  const userDoc = await User.findOne({ firebaseUid: decoded.uid }).lean();
  if (!userDoc) {
    return NextResponse.json({ error: 'Unauthorized: no such user' }, { status: 401 });
  }
  const vehicleId = req.nextUrl.searchParams.get('vehicleId');
  if (!vehicleId) {
    return NextResponse.json({ error: 'Missing vehicleId' }, { status: 400 });
  }
  let vid;
  try {
    vid = new mongoose.Types.ObjectId(vehicleId);
  } catch {
    return NextResponse.json({ error: 'Invalid vehicleId' }, { status: 400 });
  }
  const repairs = await Repair.find({ vehicleId: vid }).sort({ repairedDate: -1 }).lean();
  return NextResponse.json(repairs, { status: 200 });
}

export async function POST(req) {
  await connectToMongoose();
  const decoded = await verifyIdToken(req);
  if (decoded instanceof Response) return decoded;
  const userDoc = await User.findOne({ firebaseUid: decoded.uid });
  if (!userDoc) {
    return NextResponse.json({ error: 'Unauthorized: no such user' }, { status: 401 });
  }
  const vehicleId = new URL(req.url).searchParams.get('vehicleId');
  if (!vehicleId) {
    return NextResponse.json({ error: 'Missing vehicleId' }, { status: 400 });
  }
  let vid;
  try {
    vid = new mongoose.Types.ObjectId(vehicleId);
  } catch {
    return NextResponse.json({ error: 'Invalid vehicleId' }, { status: 400 });
  }
  const {
    repairedDate,
    billingPrice,
    isAccident,
    repairCategories,
    batteryVoltage,
    etcRepairParts,
    memo
  } = await req.json();
  const doc = {
    vehicleId:          vid,
    repairer:           userDoc._id.toString(),
    repairStationCode:  userDoc.stationCode,
    repairStationLabel: userDoc.stationLabel,
    repairedDate:       new Date(repairedDate),
    billingPrice,
    isAccident,
    repairCategories,
    batteryVoltage,
    etcRepairParts,
    memo
  };
  const created = await Repair.create(doc);
  return NextResponse.json(created, { status: 201 });
}
