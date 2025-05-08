import { NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getUsersCollection, getGuardiansCollection } from '@/lib/db/models';

export async function POST(req) {
    const { idToken, phoneNumber, role, vehicleId, userPhoneNumber } = await req.json(); // userPhoneNumber: 보호자일 경우, 보호대상 유저의 전화번호
    if (!idToken) return NextResponse.json({ error: 'Missing firebase idToken' }, { status: 400 });

    const decoded = await getAuth().verifyIdToken(idToken);
    const firebaseUid = decoded.uid;

    const users = await getUsersCollection();
    const guardians = await getGuardiansCollection();

    try {
        const user = await users.findOne({ firebaseUid });
        if (user) {
            return NextResponse.json({ error: 'User already exists' }, { status: 400 });
        }

        if (role === 'user') { // 유저는 가입시 차량 QR코드 스캔하여 얻은 vehicleId를 입력
            await users.insertOne({
                firebaseUid,
                phoneNumber,
                role,
                vehicleIds: [vehicleId], // array of ObjectId
                guardianIds: [], // array of ObjectId
                createDate: new Date(),
                updateDate: new Date(),
            });
        } else if (role === 'guardian') { // 보호자는 가입시 유저 전화번호를 입력
            await users.insertOne({
                firebaseUid,
                phoneNumber,
                role,
                vehicleIds: [], // empty for guardian
                guardianIds: [], // empty for guardian
                createDate: new Date(),
                updateDate: new Date(),
            });

            // 보호자 - 보호대상자 등록
            const gUser = await users.findOne({ phoneNumber: userPhoneNumber });
            if (!gUser) {
                return NextResponse.json({ error: 'Target User not found (guardian)' }, { status: 400 });
            }

            const addedGuardian = await guardians.insertOne({
                firebaseUid: firebaseUid,
                userId: gUser._id,
                createDate: new Date(),
                updateDate: new Date(),
            });

            await users.updateOne( // 보호대상 유저의 보호자 리스트에 보호자 ObjectId 추가
                { _id: gUser._id },
                { $addToSet: { guardianIds: addedGuardian.insertedId } }
            );
        }

        return NextResponse.json({ message: 'new User Registered!' }, { status: 200 });

    } catch (error) {
        console.error('Error creating user:', error);
        return NextResponse.json({ error: 'Error creating user' }, { status: 500 });
    }
}
