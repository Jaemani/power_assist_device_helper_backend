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
  const { vehicleId } = await params;
  const { motorNoise, 
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
    checkedAt: Date.now(),
  });

  const detail =
    (motorNoise? "구동 시 모터에서 시끄러운 소음이나 심한 진동\n" : "") +
    (abnormalSpeed? "속도가 너무 느리거나 너무 빠르게 느껴짐\n" : "") +
    (batteryBlinking? "계기판에 배터리 경고등 점멸\n" : "") +
    (chargingNotStart? "충전이 안됨\n" : "") +
    (breakDelay? "브레이크 작동이 지연됨\n" : "") +
    (breakPadIssue? "브레이크 패드 마모 또는 금이 감\n" : "") +
    (tubePunctureFrequent? "타이어 펑크가 잦음\n" : "") +
    (tireWearFrequent? "타이어 마모가 잦음\n" : "") +
    (batteryDischargeFast? "배터리 방전이 잦음\n" : "") +
    (incompleteCharging? "완충이 안됨\n" : "") +
    (seatUnstable? "시트가 느슨함\n" : "") +
    (seatCoverIssue? "시트 커버 손상\n" : "" ) +
    (footRestLoose? "발걸이가 느슨함\n" : "") +
    (antislipWorn? "미끄럼 방지 고무 패드 마모\n" : "") +
    (frameNoise? "프레임에서 소음 발생\n" : "") +
    (frameCrack? "프레임이 깨지거나 금이 가거나 휘어짐\n" : "");

  // — 이상 감지 & 동의된 경우에만 SMS 전송
  if (user.smsConsent && detail.length > 0) {
    const text = `* 자가점검 이상 알림\n- 전동보장구ID: ${vehicleId}\n- 사용자: ${user.name}\n- 상세: \n${detail}`;
    await sendSms(text, process.env.SENDER_PHONE_NUMBER);
  }

  // — 성공 응답
  return NextResponse.json(
    { success: true },
    { status: 200, headers: getCorsHeaders(origin) }
  );
});