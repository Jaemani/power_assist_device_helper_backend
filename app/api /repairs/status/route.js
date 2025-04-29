// 전체 수리 통계를 조회하는 API

import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.info(`[Repair API] 수리 통계 조회 요청 수신`);

    const dummyStats = {
      totalRepairs: 25,
      averageCost: 120000
    };

    return NextResponse.json(
      { success: true, stats: dummyStats },
      { status: 200 }
    );
  } catch (error) {
    console.error(`[Repair API][Error] 수리 통계 조회 실패: ${error.message}`);

    return NextResponse.json(
      { success: false, error: '서버 오류로 수리 통계를 불러올 수 없습니다.' },
      { status: 500 }
    );
  }
}
