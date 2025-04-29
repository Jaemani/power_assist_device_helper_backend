import { decodeQR } from '@/lib/middleware/decryptQR';
// import { verifyAuth } from '@/lib/middleware/verifyAuth';
import { NextResponse } from 'next/server';

export function middleware(req) {
  // Decode user ID
  const decodeResponse = decodeQR(req);
  if (decodeResponse instanceof NextResponse && decodeResponse.status !== 200) {
    return decodeResponse;
  } // If object is an instance of ClassName, returns true.

  // Verify authentication
  // const authResponse = verifyAuth(req);
  // if (authResponse instanceof NextResponse && authResponse.status !== 200) {
  //   return authResponse;
  // }


  // All middlewares passed
  return NextResponse.next();
}

export const config = {
  matcher: ['/api/users/:userId*'],
};
