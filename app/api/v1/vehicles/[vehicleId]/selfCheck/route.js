import { NextResponse } from 'next/server';
import connectToMongoose from '@/lib/db/connect';
import { Users, Vehicles, SelfChecks } from '@/lib/db/models';
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

export const GET = withAuth(async (req, { params }, decoded) => {
  try {

    const origin = req.headers.get('origin') || '';
    const { vehicleId } = await params;
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

    if (String(vehicle.userId) !== String(user._id)) {
      return NextResponse.json(
        { error: 'Not the vehicle owner' },
        { status: 404, headers: getCorsHeaders(origin) }
      );
    }

    const selfChecks = await SelfChecks.find({ vehicleId: vehicle._id }).sort({ _id: -1 }).lean();
    if (!selfChecks) {
      return NextResponse.json(
        { error: 'No self check records found' },
        { status: 404, headers: getCorsHeaders(origin) }
      );
    }

    const simplified = selfChecks.map((selfCheck) => ({
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
    }));

    return NextResponse.json({ 
      selfChecks: simplified },
      { status: 200, 
        headers: getCorsHeaders(origin) }
    );
  } catch (error) {
    console.error('Error in GET /selfCheck:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500, headers: getCorsHeaders(req.headers.get('origin') || '') }
    );
  }
});

export const POST = withAuth(async (req, { params }, decoded) => {
  const origin = req.headers.get('origin') || '';
  const { vehicleId } = await params;
  const { 
    motorNoise, 
    abnormalSpeed, 
    batteryBlinking, 
    chargingNotStart, 
    breakDelay, 
    breakPadIssue, 
    tubePunctureFrequent, 
    tireWearFrequent, 
    batteryDischargeFast, 
    incompleteCharging, 
    seatUnstable, 
    seatCoverIssue, 
    footRestLoose, 
    antislipWorn, 
    frameNoise, 
    frameCrack, } = await req.json();
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

  // — vehicle 소유권 확인
  if (String(vehicle.userId) !== String(user._id)) {
    return NextResponse.json(
      { error: 'Forbidden: not the vehicle owner' },
      { status: 403, headers: getCorsHeaders(origin) }
    );
  }

  console.log("자가점검 기록 저장 요청", {
    vehicleId,
    userId: user._id,
    motorNoise, 
    abnormalSpeed, 
    batteryBlinking, 
    chargingNotStart, 
    breakDelay, 
    breakPadIssue, 
    tubePunctureFrequent, 
    tireWearFrequent, 
    batteryDischargeFast, 
    incompleteCharging, 
    seatUnstable, 
    seatCoverIssue, 
    footRestLoose, 
    antislipWorn, 
    frameNoise, 
    frameCrack,
  });

  // — DB에 자가점검 기록 저장
  await SelfChecks.create({
    vehicleId: new mongoose.Types.ObjectId(vehicle._id.toString()),
    userId: new mongoose.Types.ObjectId(user._id.toString()),
    motorNoise, 
    abnormalSpeed, 
    batteryBlinking, 
    chargingNotStart, 
    breakDelay, 
    breakPadIssue, 
    tubePunctureFrequent, 
    tireWearFrequent, 
    batteryDischargeFast, 
    incompleteCharging, 
    seatUnstable, 
    seatCoverIssue, 
    footRestLoose, 
    antislipWorn, 
    frameNoise, 
    frameCrack,
  });

  const detail =
  (motorNoise ? "- 모터 소음 및 진동" : "") +
  (abnormalSpeed ? "\n- 비정상적인 속도 변화" : "") +
  (batteryBlinking ? "\n- 배터리 경고등 점멸" : "") +
  (chargingNotStart ? "\n- 충전 불가" : "") +
  (breakDelay ? "\n- 브레이크 작동 지연" : "") +
  (breakPadIssue ? "\n- 브레이크 패드 마모/파손" : "") +
  (tubePunctureFrequent ? "\n- 타이어 펑크 자주 발생" : "") +
  (tireWearFrequent ? "\n- 타이어 마모 심함" : "") +
  (batteryDischargeFast ? "\n- 배터리 방전 빠름" : "") +
  (incompleteCharging ? "\n- 완충되지 않음" : "") +
  (seatUnstable ? "\n- 시트 고정 불량" : "") +
  (seatCoverIssue ? "\n- 시트 커버 손상" : "") +
  (footRestLoose ? "\n- 발걸이 고정 불량" : "") +
  (antislipWorn ? "\n- 미끄럼 방지 패드 마모" : "") +
  (frameNoise ? "\n- 프레임에서 소음 발생" : "") +
  (frameCrack ? "\n- 프레임 손상 또는 휘어짐" : "");

  if (user.smsConsent && detail.length > 0) {
    const text =
      `수리수리 마수리 - 자가점검 이상 감지\n\n` +
      `전동보장구 ID: ${vehicleId}\n` +
      `사용자: ${user.name}\n\n` +
      `이상 항목:\n${detail}\n\n` +
      `※ 빠른 조치를 권장합니다. 자세한 내용은 수리수리 마수리 관리자 대시보드에서 확인하세요.`;

    await sendSms(text, process.env.SENDER_PHONE_NUMBER);
  }



  // — 성공 응답
  return NextResponse.json(
    { success: true },
    { status: 200, headers: getCorsHeaders(origin) }
  );
});
