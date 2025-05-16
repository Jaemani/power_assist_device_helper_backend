import { NextResponse } from 'next/server';
import connectToMongoose from '@/lib/db/connect';
import { Users, Vehicles } from '@/lib/db/models';
import { SelfChecks } from '@/lib/db/models';
import { withAuth } from '@/lib/auth/withAuth';
import { sendSms } from '@/lib/sms';
import { getCorsHeaders } from '@/lib/cors';
import mongoose from 'mongoose';

await connectToMongoose();

export async function OPTIONS(req) {
  const origin = req.headers.get('origin') || '';
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(origin),
  });
}

export const POST = withAuth(async (req, { params }, decoded) => {
  const origin = req.headers.get('origin') || '';
  const { vehicleId } = params;
  const { detail } = await req.json();

  // — 로그인 유저 조회
  const user = await Users.findOne({ firebaseUid: decoded.user_id });
  if (!user) {
    return NextResponse.json(
      { error: 'User not found' },
      { status: 404, headers: getCorsHeaders(origin) }
    );
  }

  const vehicle = await Vehicles.findOne({ vehicleId });
  if (!vehicle) {
    return NextResponse.json(
      { error: 'Invalid vehicleId' },
      { status: 404, headers: getCorsHeaders(origin) }
    );
  }

  // — DB에 자가점검 기록 저장
  await SelfChecks.create({
    vehicleId: new mongoose.Types.ObjectId(vehicle._id.toString()),
    userId: new mongoose.Types.ObjectId(user._id.toString()),
    detail,
    checkedAt: new Date(),
  });

  // — 이상 감지 & 동의된 경우에만 SMS 전송
  if (user.smsConsent) {
    const text = `⚠️ 자가점검 이상 알림
        전동보장구ID: ${vehicleId}
        사용자: ${user.name}
        상세: ${detail || '없음'}`;
    await sendSms(text, process.env.MANAGER_PHONE);
  }

  // — 성공 응답
  return NextResponse.json(
    { success: true },
    { status: 200, headers: getCorsHeaders(origin) }
  );
});