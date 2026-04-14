const express = require('express');
const router = express.Router();
const Document = require('../models/Document');

// Helper to validate and sanitize MongoDB ObjectID (removes suffixes like :1)
const sanitizeId = (id) => {
  if (!id) return null;
  // If it's a 24-char hex string, it's already clean
  if (/^[0-9a-fA-F]{24}$/.test(id)) return id;
  // If it's longer but starts with 24 hex chars (potential suffix), take the first 24
  const potentialId = id.substring(0, 24);
  if (/^[0-9a-fA-F]{24}$/.test(potentialId)) return potentialId;
  return null;
};

// Get all documents, optionally filter by type or client
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.documentType) filter.documentType = req.query.documentType;
    if (req.query.client) filter.client = req.query.client;
    
    // Populate client so frontend has access to vendor name/id easily
    const documents = await Document.find(filter)
      .populate('client')
      .sort({ date: -1, createdAt: -1 });
    res.json(documents);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single document
router.get('/:id', async (req, res) => {
  try {
    const id = sanitizeId(req.params.id);
    if (!id) {
      console.warn(`⚠️ Warning: Invalid document ID format received: ${req.params.id}`);
      return res.status(400).json({ message: `Invalid document ID format: ${req.params.id}` });
    }

    const document = await Document.findById(id).populate('client');
    if (!document) return res.status(404).json({ message: 'Document not found' });
    res.json(document);
  } catch (err) {
    console.error(`❌ Error fetching document: ${err.message}`);
    res.status(500).json({ message: err.message });
  }
});

// Create new document
router.post('/', async (req, res) => {
  const data = { ...req.body };
  
  // If document is created with an initial 'received' value, initialize payments history
  if (data.received && Number(data.received) > 0 && (!data.payments || data.payments.length === 0)) {
    const now = new Date();
    data.payments = [{
      amount: Number(data.received),
      date: now,
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      note: 'Initial Payment'
    }];
  }

  const document = new Document(data);
  try {
    const newDocument = await document.save();
    const populatedDoc = await Document.findById(newDocument._id).populate('client');
    res.status(201).json(populatedDoc);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update document (including payments/received amounts)
router.put('/:id', async (req, res) => {
  try {
    const id = sanitizeId(req.params.id);
    if (!id) {
      console.warn(`⚠️ Warning: Invalid document ID format for update: ${req.params.id}`);
      return res.status(400).json({ message: `Invalid document ID format: ${req.params.id}` });
    }

    const document = await Document.findById(id);
    if (!document) return res.status(404).json({ message: 'Document not found' });

    // Handle special NEW payment entry
    if (req.body.newPayment && Number(req.body.newPayment) > 0) {
      const now = new Date();
      document.payments.push({
        amount: Number(req.body.newPayment),
        date: now,
        time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        note: req.body.paymentNote || 'Additional Payment'
      });
      // Delete newPayment from body so it doesn't try to overwrite a model field
      delete req.body.newPayment;
      delete req.body.paymentNote;
    }

    // Update other fields, filtering out protected ones
    const protectedFields = ['_id', 'id', '__v', 'payments', 'createdAt', 'updatedAt'];
    Object.keys(req.body).forEach(key => {
      if (!protectedFields.includes(key)) {
        // Critical: Extract ID if client was sent as a populated object
        if (key === 'client' && req.body[key] && typeof req.body[key] === 'object') {
          document[key] = req.body[key]._id;
        } else {
          document[key] = req.body[key];
        }
      }
    });

    const updatedDocument = await document.save();
    console.log(`✅ Success: Updated document ${updatedDocument.recordNo || updatedDocument._id}. New balance: ${updatedDocument.balance}`);
    const populatedDoc = await Document.findById(updatedDocument._id).populate('client');
    res.json(populatedDoc);
  } catch (err) {
    console.error(`❌ Error updating document ${req.params.id}: ${err.message}`);
    res.status(400).json({ message: err.message });
  }
});

// Delete document
router.delete('/:id', async (req, res) => {
  try {
    const id = sanitizeId(req.params.id);
    if (!id) {
      console.warn(`⚠️ Warning: Invalid document ID format for delete: ${req.params.id}`);
      return res.status(400).json({ message: `Invalid document ID format: ${req.params.id}` });
    }

    const document = await Document.findByIdAndDelete(id);
    if (!document) return res.status(404).json({ message: 'Document not found' });
    console.log(`✅ Success: Deleted document ${id}`);
    res.json({ message: 'Document deleted successfully' });
  } catch (err) {
    console.error(`❌ Error deleting document ${req.params.id}: ${err.message}`);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
