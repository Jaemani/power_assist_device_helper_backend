import { getAuth } from 'firebase-admin/auth';
import { getUsersCollection, getGuardiansCollection } from '@/lib/db/models';
import { signToken } from '@/lib/auth/JWT';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { idToken } = await req.json(); // firebase에서 받아온 idToken
    if (!idToken) return NextResponse.json({ error: 'Missing firebase idToken' }, { status: 400 });

    const decoded = await getAuth().verifyIdToken(idToken);
    const firebaseUid = decoded.uid;

    const guardians = await getGuardiansCollection();
    const users = await getUsersCollection();
    const user = await users.findOne({ firebaseUid });

    if (!user) return NextResponse.json({ status: 'register', firebaseUid }, { status: 200 });

    let guardian_uid = ""; // default

    if (user.role === 'guardian') { // 보호자일 경우 보호대상 유저의 id 받아옴
      const guardian = await guardians.findOne({ userId: user._id });
      guardian_uid = guardian.userId.toString();
    }

    const token = signToken({ uid: user._id.toString(), role: user.role, guid: guardian_uid });

    return NextResponse.json({ status: 'login', token }, { status: 200 });
  } catch (error) {
    console.error('Error during login:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
