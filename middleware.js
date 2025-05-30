// Root-level middleware for concise API request / response logging

import { NextResponse } from 'next/server';

// Attempt to decode JWT payload (base64url) to extract id / role information
function extractUser(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  const parts = token.split('.');
  if (parts.length < 2) return null;
  try {
    const payloadJson = Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
    const payload = JSON.parse(payloadJson);
    const id = payload.id || payload.sub || payload.uid || payload.user_id;
    const role = payload.role || payload.claims?.role;
    const email = payload.email || payload.preferred_username;
    const name = payload.name;
    return { id, role, email, name };
  } catch {
    return null;
  }
}

export async function middleware(request) {
  const start = Date.now();

  const { method } = request;
  const path = request.nextUrl.pathname;
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

  const user = extractUser(request.headers.get('authorization'));
  const userStr = user ? `${user.name || user.email || user.id || 'unknown'}${user.role ? `(${user.role})` : ''}` : 'guest';

  console.log(`➡️  [REQ] ${method} ${path} — ip:${ip} — ${userStr}`);

  // Let the request continue
  const response = await NextResponse.next();

  const duration = Date.now() - start;
  const { status } = response;
  const statusEmoji = status >= 500 ? '💥' : status >= 400 ? '❗' : '✅';

  console.log(`${statusEmoji} [RES] ${status} ${method} ${path} — ${duration}ms — ${userStr}`);

  return response;
}

export const config = {
  matcher: ['/api/:path*'],
}; 