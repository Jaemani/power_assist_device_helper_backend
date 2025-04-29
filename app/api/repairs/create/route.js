// 새로운 수리 이력을 생성하는 API 

import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const data = await request.json();

    console.info(`[Repair API] 수리 이력 생성 요청 수신`, data);

    if (!data.description || !data.date) {
      return NextResponse.json(
        { success: false, error: '수리 설명과 날짜를 입력해야 합니다.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: true, message: '수리 이력이 성공적으로 생성되었습니다.' },
      { status: 201 }
    );
  } catch (error) {
    console.error(`[Repair API][Error] 수리 이력 생성 실패: ${error.message}`);

    return NextResponse.json(
      { success: false, error: '서버 오류로 수리 이력을 생성할 수 없습니다.' },
      { status: 500 }
    );
  }
}