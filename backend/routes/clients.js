const express = require('express');
const router = express.Router();
const Client = require('../models/Client');

// Get all clients (public for testing)
router.get('/', async (req, res) => {
  try {
    const clients = await Client.find();
    res.json({ success: true, data: clients });
  } catch (err) {
    console.error('Error fetching clients:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get client by ID (public for testing)
router.get('/:id', async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ success: false, error: 'Client not found' });
    res.json({ success: true, data: client });
  } catch (err) {
    console.error('Error fetching client:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create new client (public for testing)
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, address, company } = req.body;
    const client = new Client({ name, email, phone, address, company });
    const newClient = await client.save();
    res.status(201).json({ success: true, data: newClient });
  } catch (err) {
    console.error('Error creating client:', err);
    res.status(400).json({ success: false, error: err.message });
  }
});

// Update client (public for testing)
router.put('/:id', async (req, res) => {
  try {
    const updatedClient = await Client.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedClient) return res.status(404).json({ success: false, error: 'Client not found' });
    res.json({ success: true, data: updatedClient });
  } catch (err) {
    console.error('Error updating client:', err);
    res.status(400).json({ success: false, error: err.message });
  }
});

// Delete client (public for testing)
router.delete('/:id', async (req, res) => {
  try {
    const deletedClient = await Client.findByIdAndDelete(req.params.id);
    if (!deletedClient) return res.status(404).json({ success: false, error: 'Client not found' });
    res.json({ success: true, message: 'Client deleted' });
  } catch (err) {
    console.error('Error deleting client:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router; 