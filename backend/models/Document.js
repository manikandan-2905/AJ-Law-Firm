const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: false
  },
  documentType: {
    type: String,
    enum: ['EC', 'Nagal', 'Agreement', 'Deed'],
    required: true
  },
  recordNo: {
    type: String,
    sparse: true,
    unique: true
  },
  date: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Completed', 'In Progress', 'Registered', 'Draft', 'Signed'],
    default: 'Pending'
  },
  // Details (Flexible properties depending on Document Type)
  office: String,
  nagar: String,
  surveyNo: String,
  tpNo: String,
  plotNo: String,
  reference: String,
  deedType: String,
  docNo: String,
  fieldVisit: String,
  returnDocument: String,
  customerName: String,
  vendor: String,
  ecNo: String,
  nagalNo: String,
  agreementType: String,
  deed: String,
  
  // Financial Tracking
  amount: { type: Number, default: 0 },
  commission: { type: Number, default: 0 },
  editFee: { type: Number, default: 0 },
  stamp: { type: Number, default: 0 },
  others: { type: Number, default: 0 },
  writingFee: { type: Number, default: 0 },
  ddCommission: { type: Number, default: 0 },
  totalFee: { type: Number, default: 0 },
  received: { type: Number, default: 0 },
  balance: { type: Number, default: 0 }
}, { timestamps: true });

// Pre-save middleware to calculate totalFee and balance accurately
documentSchema.pre('save', function () {
  this.totalFee = (this.amount || 0) + (this.commission || 0) + (this.editFee || 0) + (this.stamp || 0) + (this.others || 0);
  this.balance = this.totalFee - (this.received || 0);
  
  // Auto-update status if balance is 0 and it was originally Pending
  if (this.balance <= 0 && this.status === 'Pending') {
    this.status = 'Completed';
  }
});

module.exports = mongoose.model('Document', documentSchema);
