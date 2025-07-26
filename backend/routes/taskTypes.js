const express = require('express');
const router = express.Router();
const TaskType = require('../models/TaskType');

// Get all task types
router.get('/', async (req, res) => {
  try {
    const types = await TaskType.find();
    res.json({ success: true, data: types });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create new task type
router.post('/', async (req, res) => {
  try {
    const type = new TaskType(req.body);
    const newType = await type.save();
    res.status(201).json({ success: true, data: newType });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Update task type
router.put('/:id', async (req, res) => {
  try {
    const updatedType = await TaskType.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedType) return res.status(404).json({ success: false, error: 'TaskType not found' });
    res.json({ success: true, data: updatedType });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Delete task type
router.delete('/:id', async (req, res) => {
  try {
    const deletedType = await TaskType.findByIdAndDelete(req.params.id);
    if (!deletedType) return res.status(404).json({ success: false, error: 'TaskType not found' });
    res.json({ success: true, message: 'TaskType deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router; 