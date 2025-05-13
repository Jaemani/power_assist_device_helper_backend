import mongoose from 'mongoose';

const RepairStationListSchema = new mongoose.Schema({
  state: { type: String, required: true }, // 도
  city:   { type: String, required: true }, // 시
  region: { type: String, required: true }, // 구
  address: { type: String, required: true }, // 주소
  name: { type: String, required: true }, // 상호명
  telephone: { type: String, required: true }, // 전화번호
  coordinate: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    },
    /* 저장 예시
        coordinate: {
        type: 'Point',
        coordinates: [127.027619, 37.497942] // [lng, lat]
        } 
    */
  }
}, { timestamps: true, versionKey: false });

const RepairStationListModel = mongoose.models.repairStationList || mongoose.model('repairStationList', RepairStationListSchema, 'repairstationlist');

export default RepairStationListModel;
