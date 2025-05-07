import { getAuth } from 'firebase-admin/auth';
import { getUsersCollection, getGuardiansCollection } from '@/lib/db/models';
import { signToken } from '@/lib/auth/JWT';

export async function POST(req) {
  const { idToken } = await req.json(); // firebase에서 받아온 idToken
  if (!idToken) return new Response('Missing firebase idToken', { status: 400 });

  const decoded = await getAuth().verifyIdToken(idToken);
  const firebaseUid = decoded.uid;

  const guardians = await getGuardiansCollection();
  const users = await getUsersCollection();
  const user = await users.findOne({ firebaseUid });

  if (!user) {
    return new Response(JSON.stringify({ status: 'register', firebaseUid }), { status: 200 });
  }

  let guardian_uid = "not guardian"; // default

  if (user.role === 'guardian') { // 보호자일 경우 보호대상 유저의 id 받아옴
    const guardian = await guardians.findOne({ userId: user._id });
    guardian_uid = guardian.userId.toString();
  }



  const token = signToken({ uid: user._id.toString(), role: user.role });

  return new Response(JSON.stringify({ status: 'login', token, guardian_uid }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
