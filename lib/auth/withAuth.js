import { firebaseAuth } from './firebaseAuth';
import { validateAdminToken } from './adminAuth';
import { NextResponse } from 'next/server';
import { getCorsHeaders } from '../cors';

export function withAuth(handler) {
  return async (req, ctx) => {
    const origin = req.headers.get('origin') || '';
    
    // 1. 관리자 JWT 검사 우선
    const adminCheck = await validateAdminToken(req);
    if (!(adminCheck instanceof NextResponse)) {
      // adminCheck은 request.user를 포함한 원래 req 리턴
      return handler(req, ctx, { role: 'admin', ...adminCheck.user });
    }

    // 2. 일반 Firebase 인증
    const result = await firebaseAuth(req);
    if (!result.passed) {
      return NextResponse.json({ error: result.error }, { status: result.status, headers: getCorsHeaders(origin) });
    }

    return handler(req, ctx, result.data); // decoded Firebase token
  };
}
