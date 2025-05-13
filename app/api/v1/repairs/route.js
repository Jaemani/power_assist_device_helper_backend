import initializeFirebaseAdmin from '@/lib/firebaseAdmin';
import connectToMongoose from '@/lib/db/connect';
import { getAuth } from 'firebase-admin/auth';
import { Repairs, Users, Vehicles } from '@/lib/db/models';
import { NextResponse } from 'next/server';

await connectToMongoose();
await initializeFirebaseAdmin();

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS
  });
}

export async function GET(req, { params }) {
  if (!req.headers.get('authorization')) {
    return NextResponse.json(
      { error: 'Missing authorization header' },
      { status: 401, headers: CORS_HEADERS }
    );
  }
  const token = req.headers.get('authorization').split("Bearer ")[1];
  if (!token) {
    return NextResponse.json(
      { error: 'Missing firebase token' },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  let firebaseUid;
  try {
    const decoded = await getAuth().verifyToken(token);
    firebaseUid = decoded.user_id;
  } catch (error) {
    console.error('Error verifying ID token:', error);
    return NextResponse.json(
      { error: 'Invalid ID token' },
      { status: 401, headers: CORS_HEADERS }
    );
  }

  const userDoc = await Users.findOne({ firebaseUid }).lean();
  if (!userDoc) {
    return NextResponse.json(
      { error: 'Unauthorized: no such user' },
      { status: 401, headers: CORS_HEADERS }
    );
  }

  const { vehicleId } = params;
  if (!vehicleId) {
    return NextResponse.json(
      { error: 'Missing vehicleId' },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  const vehicleDoc = await Vehicles.findOne({ vehicleId }).lean();
  if (!vehicleDoc) {
    return NextResponse.json(
      { error: 'Invalid vehicleId' },
      { status: 400, headers: CORS_HEADERS }
    );
  }s

  if (
    !userDoc.vehicleIds
      ?.map((id) => id.toString())
      .includes(vehicleDoc._id.toString())
  ) {
    return NextResponse.json(
      { error: 'Forbidden: not the vehicle owner' },
      { status: 403, headers: CORS_HEADERS }
    );
  }

  const repairs = await Repairs.find({ vehicleId: vehicleDoc._id })
    .sort({ repairedDate: -1 })
    .lean();

  return NextResponse.json(repairs, { headers: CORS_HEADERS });
}

export async function POST(req, { params }) {
  await connectToMongoose();
  const decoded = await verifytoken(req);
  if (decoded instanceof NextResponse) {

    decoded.headers.set('Access-Control-Allow-Origin', '*');
    decoded.headers.set('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    decoded.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return decoded;
  }

  const userDoc = await Users.findOne({ firebaseUid: decoded.uid }).lean();
  if (!userDoc) {
    return NextResponse.json(
      { error: 'Unauthorized: no such user' },
      { status: 401, headers: CORS_HEADERS }
    );
  }

  const { vehicleId } = params;
  if (!vehicleId) {
    return NextResponse.json(
      { error: 'Missing vehicleId' },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  const vehicleDoc = await Vehicles.findOne({ vehicleId }).lean();
  if (!vehicleDoc) {
    return NextResponse.json(
      { error: 'Invalid vehicleId' },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  if (
    !userDoc.vehicleIds
      ?.map((id) => id.toString())
      .includes(vehicleDoc._id.toString())
  ) {
    return NextResponse.json(
      { error: 'Forbidden: not the vehicle owner' },
      { status: 403, headers: CORS_HEADERS }
    );
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
    typeof billingPrice    !== 'number' ||
    typeof isAccident      !== 'boolean' ||
    !Array.isArray(repairCategories) ||
    typeof batteryVoltage  !== 'number' ||
    (repairCategories.includes('기타') && !etcRepairParts) ||
    typeof repairer        !== 'string'
  ) {
    return NextResponse.json(
      { error: 'Invalid payload' },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  try {
    const newRepair = await Repairs.create({
      vehicleId:           vehicleDoc._id,
      repairer,
      repairStationCode:   userDoc.stationCode,
      repairStationLabel:  userDoc.stationLabel,
      repairedDate:        new Date(repairedDate),
      billingPrice,
      isAccident,
      repairCategories,
      batteryVoltage,
      etcRepairParts,
      memo
    });
    return NextResponse.json(newRepair, { status: 201, headers: CORS_HEADERS });
  } catch {
    return NextResponse.json(
      { error: 'Error creating repair' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
