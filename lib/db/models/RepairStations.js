import mongoose from 'mongoose';

const RepairStationSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  firebaseUid: { type: String, unique: true  }, // 모두 넣기 때문에 우선 required, unique 안함
  label: { type: String, required: true },
  state: { type: String, required: true },
  city: { type: String, required: true },
  region: { type: String, required: true },
  address: { type: String, required: true },
  telephone: { type: String, required: true },
  aid: { type: [Number], required: true, default: [0, 0, 0] }, // [일반, 차상위, 수급] - 미등록은 없음
  coordinate: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
    /* 저장 예시
        coordinate: {
        type: 'Point',
        coordinates: [127.027619, 37.497942] // [lng, lat]
        } 
    */
  }
}, {
  timestamps: true,
  versionKey: false
});

// GeoIndex 생성
RepairStationSchema.index({ coordinate: '2dsphere' });

const RepairStationModel = mongoose.models.RepairStations || mongoose.model('RepairStations', RepairStationSchema);

export default RepairStationModel;
