import connectToMongoose from '@/lib/db/connect';
import { Repairs, Users, Vehicles } from '@/lib/db/models';
import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/withAuth';
import { getCorsHeaders } from '@/lib/cors';

await connectToMongoose();

export const GET = withAuth(async (req, { params }, decoded) => {
  const origin = req.headers.get("origin") || "";

  const firebaseUid = decoded.user_id;
  const userDoc = await Users.findOne({ firebaseUid }).lean();
  if (!userDoc) {
    return NextResponse.json(
      { error: 'Unauthorized: no such user' },
      { 
        status: 401,
        headers: getCorsHeaders(req.headers.get("origin") || ""),
      }      
    );
  }

  const { vehicleId } = params;
  if (!vehicleId) {
    return NextResponse.json(
      { error: 'Missing vehicleId' },
      { 
        status: 400,
        headers: getCorsHeaders(req.headers.get("origin") || ""),
      } 
    );
  }

  const vehicleDoc = await Vehicles.findOne({ vehicleId }).lean();
  if (!vehicleDoc) {
    return NextResponse.json(
      { error: 'Invalid vehicleId' },
      { status: 400,
        headers: getCorsHeaders(req.headers.get("origin") || ""),
      }
    );
  }

  if (
    !userDoc.vehicleIds
      ?.map((id) => id.toString())
      .includes(vehicleDoc._id.toString())
  ) {
    return NextResponse.json(
      { error: 'Forbidden: not the vehicle owner' },
      { status: 403,
        headers: getCorsHeaders(req.headers.get("origin") || ""),
      }
    );
  }

  const repairs = await Repairs.find({ vehicleId: vehicleDoc._id })
    .sort({ repairedDate: -1 })
    .lean();

  return NextResponse.json(repairs, { headers: CORS_HEADERS });
});

export const POST = withAuth(async (req, { params }, decoded) => {
  const origin = req.headers.get("origin") || "";

  const { vehicleId } = params;
  if (!vehicleId) {
    return NextResponse.json(
      { error: 'Missing vehicleId' },
      { status: 400,
        headers: getCorsHeaders(req.headers.get("origin") || ""),
      }
    );
  }

  const vehicleDoc = await Vehicles.findOne({ vehicleId }).lean();
  if (!vehicleDoc) {
    return NextResponse.json(
      { error: 'Invalid vehicleId' },
      { status: 400,
        headers: getCorsHeaders(req.headers.get("origin") || ""),
      }
    );
  }

  if (
    !userDoc.vehicleIds
      ?.map((id) => id.toString())
      .includes(vehicleDoc._id.toString())
  ) {
    return NextResponse.json(
      { error: 'Forbidden: not the vehicle owner' },
      { status: 403,
        headers: getCorsHeaders(req.headers.get("origin") || ""),
      }
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
      { status: 400,
        headers: getCorsHeaders(req.headers.get("origin") || ""),
      }
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
    return NextResponse.json(newRepair, { 
        status: 201,
        headers: getCorsHeaders(req.headers.get("origin") || ""),
      });
  } catch {
    return NextResponse.json(
      { error: 'Error creating repair' },
      { status: 500,
        headers: getCorsHeaders(req.headers.get("origin") || ""),
      }
    );
  }
});

export async function OPTIONS(req) {
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(req.headers.get("origin") || ""),
    
  });
}