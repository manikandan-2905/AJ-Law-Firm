const express = require('express');
const router = express.Router();
const Document = require('../models/Document');

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
    const document = await Document.findById(req.params.id).populate('client');
    if (!document) return res.status(404).json({ message: 'Document not found' });
    res.json(document);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create new document
router.post('/', async (req, res) => {
  const document = new Document(req.body);
  try {
    const newDocument = await document.save();
    // Return populated document immediately
    const populatedDoc = await Document.findById(newDocument._id).populate('client');
    res.status(201).json(populatedDoc);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update document (including payments/received amounts)
router.put('/:id', async (req, res) => {
  try {
    // We use findById, then modify, then save() to trigger the pre('save') middleware
    const document = await Document.findById(req.params.id);
    if (!document) return res.status(404).json({ message: 'Document not found' });

    // Update fields
    Object.keys(req.body).forEach(key => {
      document[key] = req.body[key];
    });

    const updatedDocument = await document.save();
    const populatedDoc = await Document.findById(updatedDocument._id).populate('client');
    res.json(populatedDoc);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete document
router.delete('/:id', async (req, res) => {
  try {
    const document = await Document.findByIdAndDelete(req.params.id);
    if (!document) return res.status(404).json({ message: 'Document not found' });
    res.json({ message: 'Document deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
