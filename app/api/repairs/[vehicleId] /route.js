// 특정 사용자의 수리 이력을 조회하는 API 

import { NextResponse } from 'next/server';

export async function GET(_, { params }) {
  const { userId } = params;

  try {
    console.info(`[Repair API] 사용자 ${vehicleId} 수리 이력 조회 요청 수신`);

    const dummyRepairs = [
      { id: 1, description: "배터리 교체", date: "2025-04-10" },
      { id: 2, description: "타이어 점검", date: "2025-04-20" }
    ];

    return NextResponse.json(
      { success: true, repairs: dummyRepairs },
      { status: 200 }
    );
  } catch (error) {
    console.error(`[Repair API][Error] 수리 이력 조회 실패 (userId: ${vehicleId}): ${error.message}`);

    return NextResponse.json(
      { success: false, error: '서버 오류로 수리 이력을 불러올 수 없습니다.' },
      { status: 500 }
    );
  }
}