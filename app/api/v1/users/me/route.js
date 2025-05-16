import { NextResponse } from 'next/server';
import connectToMongoose from '@/lib/db/connect';
import Users from '@/lib/db/models';
import { withAuth } from '@/lib/auth/withAuth';
import { getCorsHeaders } from '@/lib/cors';

await connectToMongoose();

export async function OPTIONS(req) {
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(req.headers.get('origin') || ''),
  });
}

export const GET = withAuth(async (req, _ctx, decoded) => {
  const user = await Users.findOne({ firebaseUid: decoded.user_id });
  const body = { smsConsent: user?.smsConsent ?? false };
  return NextResponse.json(body, {
    status: 200,
    headers: getCorsHeaders(req.headers.get('origin') || ''),
  });
});

export const PATCH = withAuth(async (req, _ctx, decoded) => {
  const { smsConsent } = await req.json();
  const updated = await Users.findOneAndUpdate(
    { firebaseUid: decoded.user_id },
    { smsConsent },
    { new: true }
  );
  return NextResponse.json(
    { smsConsent: updated.smsConsent },
    {
      status: 200,
      headers: getCorsHeaders(req.headers.get('origin') || ''),
    }
  );
});
