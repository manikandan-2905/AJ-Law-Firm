const mongoose = require('mongoose');
const Document = require('../models/Document');
require('dotenv').config();

const MONGODB_URI = process.env.MONGO_URI || "mongodb+srv://mani:mani123@image-generator.x56ji.mongodb.net/?appName=Image-generator";

async function migrate() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB for migration');

    const docs = await Document.find({ 
      received: { $gt: 0 }, 
      $or: [
        { payments: { $exists: false } },
        { payments: { $size: 0 } }
      ]
    });

    console.log(`🔍 Found ${docs.length} documents with legacy 'received' values but no payment history.`);

    for (const doc of docs) {
      doc.payments = [{
        amount: doc.received,
        date: doc.date || doc.createdAt || new Date(),
        time: "10:00 AM",
        note: 'Legacy Payment Migration'
      }];
      
      // Save will trigger the pre-save hook which will recalculate received (keeping it the same) and balance
      await doc.save();
      console.log(`✔ Migrated document: ${doc.recordNo || doc.ecNo || doc._id}`);
    }

    console.log('✨ Migration process completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
}

migrate();
