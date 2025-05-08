// scripts/seed.mjs
import 'dotenv/config';
import { v4 as uuidv4 } from 'uuid';
import connectToDatabase from '../lib/db/connect.js';
import User from '../lib/models/User.js';
import Vehicle from '../lib/models/Vehicle.js';
import RepairInfo from '../lib/models/RepairInfo.js';
import RepairStation from '../lib/models/RepairStation.js';

async function seed() {
  await connectToDatabase();

  await Promise.all([
    User.deleteMany({}),
    Vehicle.deleteMany({}),
    RepairInfo.deleteMany({}),
    RepairStation.deleteMany({})
  ]);

  const firebaseUid = uuidv4();
  const user = await User.create({
    firebaseUid,
    phoneNumber: '010-1234-5678',
    role: 'user',
    vehicleIds: [],
    guardianIds: []
  });

  const vehicle = await Vehicle.create({
    vehicleId: uuidv4(),
    userId: user._id,
    deviceModel: '정동휠체어 A100',
    deviceDate: new Date('2025-05-01')
  });

  const stationCode = 'SC001';
  const station = await RepairStation.create({
    repairStationCode: stationCode,
    repairStationId: uuidv4(),
    repairStationName: '서울장애인복지관 수리센터',
    passwd: 'password123'
  });

  await RepairInfo.create({
    vehicleId: vehicle._id,
    repairReceipt: [
      {
        date: new Date('2025-05-01'),
        troubleInfo: '브레이크 이슈',
        repairDetail: '패드 교체',
        repairType: '구동장치',
        billedAmount: 50000,
        requestedAmount: 30000,
        isAccident: false,
        stationCode
      }
    ]
  });

  console.log('더미 데이터 삽입 완료');
  process.exit(0);
}

seed().catch(err => {
  console.error(' Seed 에러:', err);
  process.exit(1);
});