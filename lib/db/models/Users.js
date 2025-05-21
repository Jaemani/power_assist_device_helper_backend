// lib/models/User.js
import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  firebaseUid:   { type: String, required: true, unique: true },
  name:         { type: String, required: true },
  phoneNumber:   { type: String, required: true },
  role:          { type: String, enum: ['user','admin','repairer','guardian'], default: 'user' },
  recipientType: { type: String, enum: ['일반','차상위','수급', '미등록'], require: true },
  supportedDistrict: { type: String, enum: ['강남구','강동구','강북구','강서구','관악구','광진구','구로구','금천구','노원구','도봉구','동대문구','동작구','마포구','서대문구','서초구','성동구','성북구','송파구','양천구','영등포구','용산구','은평구','종로구','중구','중랑구','서울 외'], require: true },
  smsConsent:    { type: Boolean, default: false },
  guardianIds:   [{ type: mongoose.Types.ObjectId, ref: 'guardians' }]
}, { timestamps: true, versionKey: false }); // automatically add createdAt and updatedAt fields

const UserModel = mongoose.models.users || mongoose.model('users', UserSchema);

export default UserModel;
