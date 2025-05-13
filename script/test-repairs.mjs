import fetch from 'node-fetch';

const BASE = 'http://localhost:3000/api/v1/repairs';
const TOKEN = process.env.TOKEN;
const VEHICLE_ID = process.env.VEHICLE_ID;

async function testGet() {
  const res = await fetch(`${BASE}/${VEHICLE_ID}`, {
    headers: { Authorization: `Bearer ${TOKEN}` }
  });
  console.log('GET', res.status, await res.json());
}

async function testPost() {
  const payload = {
    repairedDate: new Date().toISOString(),
    billingPrice: 90000,
    isAccident: true,
    repairCategories: ['배터리', '기타'],
    batteryVoltage: 48.0,
    etcRepairParts: '배터리 교체',
    memo: 'Node.js 테스트',
    repairer: '박수리'
  };
  const res = await fetch(`${BASE}/${VEHICLE_ID}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TOKEN}`
    },
    body: JSON.stringify(payload)
  });
  console.log('POST', res.status, await res.json());
}

(async () => {
  await testGet();
  await testPost();
})();
