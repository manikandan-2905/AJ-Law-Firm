const express = require('express');
const router = express.Router();
const Client = require('../models/Client');
const mongoose = require('mongoose');

// Helper to sanitize and validate MongoDB ID
const sanitizeId = (id) => {
  if (!id) return null;
  // If it's a 24-char hex string, it's already clean
  if (/^[0-9a-fA-F]{24}$/.test(id)) return id;
  // If it has a suffix like :1, strip it and check the base
  const cleanId = id.toString().split(':')[0];
  if (/^[0-9a-fA-F]{24}$/.test(cleanId)) {
    console.log(`⚠️ Sanitized invalid ID format: "${id}" -> "${cleanId}"`);
    return cleanId;
  }
  return null;
};

// Get all clients
router.get('/', async (req, res) => {
  try {
    const clients = await Client.find().sort({ createdAt: -1 });
    res.json(clients);
  } catch (err) {
    console.error('❌ Error fetching clients:', err);
    res.status(500).json({ message: err.message });
  }
});

// Get a single client
router.get('/:id', async (req, res) => {
  try {
    const cleanId = sanitizeId(req.params.id);
    if (!cleanId) {
      console.warn(`⚠️ Invalid client ID format received: ${req.params.id}`);
      return res.status(400).json({ message: 'Invalid client ID format' });
    }
    const client = await Client.findById(cleanId);
    if (!client) return res.status(404).json({ message: 'Client not found' });
    res.json(client);
  } catch (err) {
    console.error('❌ Get Client Error:', err);
    res.status(500).json({ message: err.message });
  }
});

// Create a new client
router.post('/', async (req, res) => {
  const client = new Client(req.body);
  try {
    const newClient = await client.save();
    res.status(201).json(newClient);
  } catch (err) {
    console.error('❌ POST Client Error:', err);
    res.status(400).json({ message: err.message });
  }
});

// Update client
router.put('/:id', async (req, res) => {
  try {
    const cleanId = sanitizeId(req.params.id);
    if (!cleanId) {
       console.warn(`⚠️ Invalid ID format for update: ${req.params.id}`);
       return res.status(400).json({ message: 'Invalid client ID format' });
    }
    const client = await Client.findByIdAndUpdate(cleanId, req.body, { new: true, runValidators: true });
    if (!client) return res.status(404).json({ message: 'Client not found' });
    console.log(`✅ Client updated: ${cleanId}`);
    res.json(client);
  } catch (err) {
    console.error('❌ Update Client Error:', err);
    res.status(400).json({ message: err.message });
  }
});

// Delete client
router.delete('/:id', async (req, res) => {
  try {
    const cleanId = sanitizeId(req.params.id);
    if (!cleanId) {
       console.warn(`⚠️ Invalid ID format for delete: ${req.params.id}`);
       return res.status(400).json({ message: 'Invalid client ID format' });
    }
    const client = await Client.findByIdAndDelete(cleanId);
    if (!client) return res.status(404).json({ message: 'Client not found' });
    console.log(`✅ Client deleted: ${cleanId}`);
    res.json({ message: 'Client deleted successfully' });
  } catch (err) {
    console.error('❌ Delete Client Error:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
