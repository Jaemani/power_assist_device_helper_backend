import { NextResponse } from 'next/server';
import connectToMongoose from '@/lib/db/connect';
import UserModel from '@/lib/models/User';
import { withAuth } from '@/lib/auth/withAuth';
import { getCorsHeaders } from '@/lib/cors';

await connectToMongoose();

export async function OPTIONS(req) {
  const origin = req.headers.get('origin') || '';
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(origin),
  });
}

export const GET = withAuth(async (req, _ctx, decoded) => {
  const origin = req.headers.get('origin') || '';
  const user = await UserModel.findOne({ firebaseUid: decoded.user_id });
  const body = { smsConsent: user?.smsConsent ?? false };
  return NextResponse.json(body, {
    status: 200,
    headers: getCorsHeaders(origin),
  });
});

export const PATCH = withAuth(async (req, _ctx, decoded) => {
  const origin = req.headers.get('origin') || '';
  const { smsConsent } = await req.json();
  const updated = await UserModel.findOneAndUpdate(
    { firebaseUid: decoded.user_id },
    { smsConsent },
    { new: true }
  );
  return NextResponse.json(
    { smsConsent: updated.smsConsent },
    {
      status: 200,
      headers: getCorsHeaders(origin),
    }
  );
});
