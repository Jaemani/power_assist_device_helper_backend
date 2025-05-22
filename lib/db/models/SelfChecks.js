
import mongoose from 'mongoose';

const SelfCheckSchema = new mongoose.Schema({
  vehicleId: { type: mongoose.Types.ObjectId, ref: 'vehicles', required: true },
  motorNoise: { type: Boolean, required: true }, // 모터 소음 또는 진동
  abnormalSpeed: { type: Boolean, required: true }, // 속도가 느리거나 빠름
  batteryBlinking: { type: Boolean, required: true }, // 계기판 배터리 점멸
  chargingNotStart: { type: Boolean, required: true }, // 충전 안됨
  breakDelay: { type: Boolean, required: true }, // 브레이크 지연
  breakPadIssue: { type: Boolean, required: true }, // 브레이크 패드 마모 또는 금
  tubePunctureFrequent: { type: Boolean, required: true }, // 타이어 펑크 잦음
  tireWearFrequent: { type: Boolean, required: true }, // 타이어 마모 잦음
  batteryDischargeFast: { type: Boolean, required: true }, // 배터리 방전 잦음
  incompleteCharging: { type: Boolean, required: true }, // 완충이 안됨
  seatUnstable: { type: Boolean, required: true }, // 시트 느슨함
  seatCoverIssue: { type: Boolean, required: true }, // 시트 커버 손상
  footRestLoose: { type: Boolean, required: true }, // 발걸이 느슨함
  antislipWorn: { type: Boolean, required: true }, // 미끄럼 방지 고무 패드 마모
  frameNoise: { type: Boolean, required: true }, // 프레임 소음
  frameCrack: { type: Boolean, required: true }, // 프레임 깨지거나 금 가거나 휘어짐
}, {
  timestamps: true,      
  versionKey: false,
});

const SelfCheckModel = mongoose.models.selfChecks || mongoose.model('selfChecks', SelfCheckSchema);
export default SelfCheckModel
