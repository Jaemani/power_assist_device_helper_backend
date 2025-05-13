import initializeFirebaseAdmin from '@/lib/firebaseAdmin';
import { getAuth } from 'firebase-admin/auth';

export async function firebaseAuth(req) {
    await initializeFirebaseAdmin();

    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.split('Bearer ')[1];

    if (!token) return { passed: false, status: 400, error: 'Missing Firebase token' };

    try {
        const decoded = await getAuth().verifyIdToken(token);
        return { passed: true, data: decoded };
    } catch (error) {
        return { passed: false, status: 401, error: 'Invalid Firebase token' };
    }

}