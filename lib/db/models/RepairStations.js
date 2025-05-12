import mongoose from 'mongoose';

const RepairStationSchema = new mongoose.Schema({
  repairStationCode: { type: String, required: true, unique: true },
  repairStationId:   { type: String, required: true, unique: true },
  repairStationLabel: { type: String, required: true }
}, { timestamps: true, versionKey: false });

const RepairStationModel = mongoose.models.repairStations || mongoose.model('repairStations', RepairStationSchema);

export default RepairStationModel;
