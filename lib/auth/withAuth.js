import { firebaseAuth } from './firebaseAuth';
import { NextResponse } from 'next/server';

export function withAuth(handler) {
  return async (req, ctx) => {
    const result = await firebaseAuth(req); // http resposne 받아옴
    if (!result.passed) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return handler(req, ctx, result.data); // decoded token 전달, 검증 끝나야만 data를 전달할 수 있음
  };
}
