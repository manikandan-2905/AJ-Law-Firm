const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  clientType: {
    type: String,
    enum: ['Vendor', 'Customer'],
    required: true
  },
  clientId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  phone: {
    type: String
  },
  address: {
    type: String
  },
  district: {
    type: String
  },
  status: {
    type: String,
    default: 'Active'
  },
  referenceVendor: {
    type: String
  }
}, { timestamps: true });

module.exports = mongoose.model('Client', clientSchema);
