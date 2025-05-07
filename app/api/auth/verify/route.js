import { getAuth } from 'firebase-admin/auth';

export async function POST(req) {
  const { idToken } = await req.json();

  const decoded = await getAuth().verifyIdToken(idToken);
  const uid = decoded.uid;

  // 사용자 . Mongodb와 연결
  const user = await db.users.findOne({ uid });

  if (user) {
    // 로그인
    return NextResponse.json({ status: 'login', uid });
  } else {
    // 회원가입 필요
    return NextResponse.json({ status: 'User not exsist! Scan the new QR Code to Register', uid });
  }
}
