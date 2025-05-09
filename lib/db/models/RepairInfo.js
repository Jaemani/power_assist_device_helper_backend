import mongoose from 'mongoose';

const RepairRecordSchema = new mongoose.Schema({
  date:            { type: Date,   required: true },
  troubleInfo:     { type: String, required: true },
  repairDetail:    { type: String, required: true },
  repairType:      { type: String, required: true },
  billedAmount:    { type: Number, required: true },
  requestedAmount: { type: Number, default: 0 },
  isAccident:      { type: Boolean, default: false },
  stationCode:     { type: String, required: true },
  createDate:      { type: Date, default: Date.now },  
  updateDate:      { type: Date, default: Date.now }   
}, { _id: true });

const RepairInfoSchema = new mongoose.Schema({
  vehicleId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },  
  repairReceipt: [RepairRecordSchema],
  createDate:    { type: Date, default: Date.now }, 
  updateDate:    { type: Date, default: Date.now }   
}, { timestamps: true });

const RepairInfoModel = mongoose.models.RepairInfo || mongoose.model('RepairInfo', RepairInfoSchema);

export default RepairInfoModel;
