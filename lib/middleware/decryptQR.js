import { NextResponse } from 'next/server';
import { decodeId } from "@/lib/auth/stringCipher";

export function decodeQR(req) {
  const id = req.nextUrl.pathname.split('/').pop(); // Get id from QR
  if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

  const decoded = decodeId(id);
  if (!decoded) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  const res = NextResponse.next();

  res.cookies.set({
    name: 'decodedUserId',
    value: decoded.toString(),
    path: '/',
    httpOnly: false, // for debugging
  });

  return res;
}