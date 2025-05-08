// 특정 사용자의 보호자 정보를 조회하거나 수정하는 API 

import { NextResponse } from 'next/server';

export async function GET(_, { params }) {
  const { userId } = params;

  try {
    console.info(`[Guardian API] 사용자 ${userId} 보호자 정보 조회 요청 수신`);

    const dummyGuardian = {
      name: "조성현",
      phone: "010-1234-5678"
    };

    return NextResponse.json(
      { success: true, guardian: dummyGuardian },
      { status: 200 }
    );
  } catch (error) {
    console.error(`[Guardian API][Error] 보호자 정보 조회 실패 (userId: ${userId}): ${error.message}`);

    return NextResponse.json(
      { success: false, error: '서버 오류로 보호자 정보를 불러올 수 없습니다.' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  const { userId } = params;

  try {
    const data = await request.json();

    console.info(`[Guardian API] 사용자 ${userId} 보호자 정보 수정 요청 수신`, data);

    if (!data.name || !data.phone) {
      return NextResponse.json(
        { success: false, error: '보호자 이름과 전화번호를 모두 입력해야 합니다.' },
        { status: 400 }
      );
    }
 
    return NextResponse.json(
      { success: true, message: '보호자 정보가 성공적으로 수정되었습니다.' },
      { status: 200 }
    );
  } catch (error) {
    console.error(`[Guardian API][Error] 보호자 정보 수정 실패 (userId: ${userId}): ${error.message}`);

    return NextResponse.json(
      { success: false, error: '서버 오류로 보호자 정보를 수정할 수 없습니다.' },
      { status: 500 }
    );
  }
}