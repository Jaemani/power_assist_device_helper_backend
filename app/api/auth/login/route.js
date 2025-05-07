import { getAuth } from 'firebase-admin/auth';
import { getUsersCollection } from '@/lib/db/models';
import { signToken } from '@/lib/auth/JWT';

export async function POST(req) {
  const { idToken } = await req.json(); // firebase에서 받아온 idToken
  if (!idToken) return new Response('Missing firebase idToken', { status: 400 });

  const decoded = await getAuth().verifyIdToken(idToken);
  const firebaseUid = decoded.uid;

  // 사용자 . Mongodb와 연결
  const users = await getUsersCollection();
  const user = await users.findOne({ firebaseUid });

  if (!user) {
    return new Response(JSON.stringify({ status: 'register', firebaseUid }), { status: 200 });
  }

  const token = signToken({ uid: user._id.toString(), role: user.role });

  return new Response(JSON.stringify({ status: 'login', token }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
