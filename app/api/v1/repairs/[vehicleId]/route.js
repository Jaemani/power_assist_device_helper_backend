import { NextResponse } from 'next/server';
import connectToMongoose from '@/lib/db/connect';
import { Users, Vehicles, Repairs } from '@/lib/db/models';
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

// GET /api/repairs/:vehicleId/:repairId
export const GET = withAuth(async (req, { params }, decoded) => {
  // DB 연결은 handler 안에서만
  await connectToMongoose();

  const origin     = req.headers.get('origin') || '';
  const { vehicleId, repairId } = params;
  const firebaseUid = decoded.user_id;

  // vehicleId 검사
  if (!vehicleId) {
    return new NextResponse(JSON.stringify({ error: 'Missing vehicleId' }), {
      status: 400,
      headers: getCorsHeaders(origin),
    });
  }
  if (!isValidObjectId(vehicleId)) {
    return new NextResponse(JSON.stringify({ error: 'Invalid vehicleId' }), {
      status: 400,
      headers: getCorsHeaders(origin),
    });
  }

  // repairId 검사
  if (!repairId) {
    return new NextResponse(JSON.stringify({ error: 'Missing repairId' }), {
      status: 400,
      headers: getCorsHeaders(origin),
    });
  }
  if (!isValidObjectId(repairId)) {
    return new NextResponse(JSON.stringify({ error: 'Invalid repairId' }), {
      status: 400,
      headers: getCorsHeaders(origin),
    });
  }

  // 사용자 조회
  const userDoc = await Users.findOne({ firebaseUid }).lean();
  if (!userDoc) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized: no such user' }), {
      status: 401,
      headers: getCorsHeaders(origin),
    });
  }

  // vehicle 소유권 확인
  const vehicleDoc = await Vehicles.findOne({ _id: vehicleId }).lean();
  if (!vehicleDoc || String(vehicleDoc.owner) !== String(userDoc._id)) {
    return new NextResponse(JSON.stringify({ error: 'Forbidden: not the vehicle owner' }), {
      status: 403,
      headers: getCorsHeaders(origin),
    });
  }

  // repair 문서 조회
  const repairDoc = await Repairs.findById(repairId).lean();
  if (
    !repairDoc ||
    String(repairDoc.vehicleId) !== vehicleId
  ) {
    return new NextResponse(JSON.stringify({ error: 'Repair not found' }), {
      status: 404,
      headers: getCorsHeaders(origin),
    });
  }

  return new NextResponse(JSON.stringify(repairDoc), {
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
