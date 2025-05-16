// lib/models/User.js
import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  firebaseUid:   { type: String, required: true, unique: true },
  name:         { type: String, required: true },
  phoneNumber:   { type: String, required: true },
  role:          { type: String, enum: ['user','admin','repairer','guardian'], default: 'user' },
  recipientType: { type: String, enum: ['general','lowIncome','welfare', 'unregistered'], require: true },
  smsConsent:    { type: Boolean, default: false },
  guardianIds:   [{ type: mongoose.Types.ObjectId, ref: 'guardians' }]
}, { timestamps: true, versionKey: false }); // automatically add createdAt and updatedAt fields

const UserModel = mongoose.models.users || mongoose.model('users', UserSchema);

export default UserModel;
