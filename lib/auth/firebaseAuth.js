import initializeFirebaseAdmin from '@/lib/firebaseAdmin';
import { getAuth } from 'firebase-admin/auth';
import { getCorsHeaders } from '../cors';

export async function firebaseAuth(req) {
    const origin = req.headers.get('origin') || '';

    await initializeFirebaseAdmin();

    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.split('Bearer ')[1];

    if (!token) return { passed: false, status: 400, error: 'Missing Firebase token', headers: getCorsHeaders(origin) };

    try {
        const decoded = await getAuth().verifyIdToken(token);
        return { passed: true, data: decoded };
    } catch (error) {
        return { passed: false, status: 401, error: 'Invalid Firebase token', headers: getCorsHeaders(origin) };
    }

}