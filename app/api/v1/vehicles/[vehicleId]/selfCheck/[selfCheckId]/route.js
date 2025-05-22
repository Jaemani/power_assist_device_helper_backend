import { NextResponse } from 'next/server';
import connectToMongoose from '@/lib/db/connect';
import { Users, Vehicles, SelfChecks } from '@/lib/db/models';
import { withAuth } from '@/lib/auth/withAuth';
import { getCorsHeaders } from '@/lib/cors';
import mongoose from 'mongoose';

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id) && id.length === 24;
}

// OPTIONS (preflight)
export async function OPTIONS(req) {
  const origin = req.headers.get('origin') || '';
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(origin),
  });
}

export const GET = withAuth(async (req, { params }, decoded) => {
  // DB 연결은 handler 안에서만
  await connectToMongoose();

  const origin       = req.headers.get('origin') || '';
  const { vehicleId, selfCheckId } = await params;
  const firebaseUid  = decoded.user_id;

  // vehicleId 검사
  if (!vehicleId) {
    return new NextResponse(JSON.stringify({ error: 'Missing vehicleId' }), {
      status: 400,
      headers: getCorsHeaders(origin),
    });
  }

  const vehicle = await Vehicles.findOne({ vehicleId });

  if (!vehicle) {
      return new NextResponse(JSON.stringify({ error: 'Invalid vehicleId' }), {
          status: 400,
          headers: getCorsHeaders(origin),
      });
  }

  // selfCheckId 검사
  if (!selfCheckId) {
    return new NextResponse(JSON.stringify({ error: 'Missing selfCheckId' }), {
      status: 400,
      headers: getCorsHeaders(origin),
    });
  }
  if (!isValidObjectId(selfCheckId)) {
    return new NextResponse(JSON.stringify({ error: 'Invalid selfCheckId' }), {
      status: 400,
      headers: getCorsHeaders(origin),
    });
  }

  // 사용자 조회
  const userDoc = await Users.findOne({ firebaseUid }).lean();
  if (!userDoc) {
    return new NextResponse(JSON.stringify({ error: 'User not found' }), {
      status: 404,
      headers: getCorsHeaders(origin),
    });
  }

  // vehicle 소유권 확인
  const vehicleDoc = await Vehicles.findOne({ _id: vehicle._id.toString() }).lean();
  if (!vehicleDoc || String(vehicleDoc.userId) !== String(userDoc._id)) {
    return new NextResponse(JSON.stringify({ error: 'No self check records found' }), {
      status: 404,
      headers: getCorsHeaders(origin),
    });
  }

  // selfCheck 문서 조회
  console.log("selfCheckId: " + selfCheckId.toString());
  const selfCheck = await SelfChecks.findOne({ _id: selfCheckId.toString() }).lean();
  if (!selfCheck) {
    return new NextResponse(JSON.stringify({ error: 'SelfCheck not found' }), {
      status: 404,
      headers: getCorsHeaders(origin),
    });
  }
  
  return NextResponse.json({
    id: selfCheck._id.toString(),
    vehicleId: selfCheck.vehicleId.toString(),
    motorNoise: selfCheck.motorNoise,
    abnormalSpeed: selfCheck.abnormalSpeed,
    batteryBlinking: selfCheck.batteryBlinking,
    chargingNotStart: selfCheck.chargingNotStart,
    breakDelay: selfCheck.breakDelay,
    breakPadIssue: selfCheck.breakPadIssue,
    tubePunctureFrequent: selfCheck.tubePunctureFrequent,
    tireWearFrequent: selfCheck.tireWearFrequent,
    batteryDischargeFast: selfCheck.batteryDischargeFast,
    incompleteCharging: selfCheck.incompleteCharging,
    seatUnstable: selfCheck.seatUnstable,
    seatCoverIssue: selfCheck.seatCoverIssue,
    footRestLoose: selfCheck.footRestLoose,
    antislipWorn: selfCheck.antislipWorn,
    frameNoise: selfCheck.frameNoise,
    frameCrack: selfCheck.frameCrack,
    createdAt: selfCheck.createdAt,
    }, {
    status: 200,
    headers: getCorsHeaders(origin),
  });
});

// 지원하지 않는 메서드 (405)
function methodNotAllowed(req) {
  const origin = req.headers.get('origin') || '';
  return new NextResponse(null, {
    status: 405,
    headers: {
      ...getCorsHeaders(origin),
      'Content-Type': 'text/xml',
    },
  });
}

export const POST   = methodNotAllowed;
export const PUT    = methodNotAllowed;
export const PATCH  = methodNotAllowed;
export const DELETE = methodNotAllowed;
export const HEAD   = methodNotAllowed;
