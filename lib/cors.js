// lib/cors.ts
const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3001",  // Add React development server
  "http://127.0.0.1:3001",  // Add React development server alternative
  "http://localhost:3000",  // Add Next.js development server
  "http://127.0.0.1:3000",  // Add Next.js development server alternative
  "https://soo-ri.web.app",
  "https://soo-ri-admin.web.app",
];

export const getCorsHeaders = (origin) => {
  const allowOrigin = origin && ALLOWED_ORIGINS.includes(origin)
    ? origin
    : ALLOWED_ORIGINS[0]; // fallback: localhost

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true",
  };
};