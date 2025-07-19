const express = require('express');
const router = express.Router();
const Task = require('../models/Task');

// Get all tasks (public for testing)
router.get('/', async (req, res) => {
  try {
    const tasks = await Task.find();
    res.json({ success: true, data: tasks });
  } catch (err) {
    console.error('Error fetching tasks:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get task by ID (public for testing)
router.get('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, error: 'Task not found' });
    res.json({ success: true, data: task });
  } catch (err) {
    console.error('Error fetching task:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create new task (public for testing)
router.post('/', async (req, res) => {
  try {
    const { title, description, project, assignedTo, priority, status, dueDate } = req.body;
    const task = new Task({ title, description, project, assignedTo, priority, status, dueDate });
    const newTask = await task.save();
    res.status(201).json({ success: true, data: newTask });
  } catch (err) {
    console.error('Error creating task:', err);
    res.status(400).json({ success: false, error: err.message });
  }
});

// Update task (public for testing)
router.put('/:id', async (req, res) => {
  try {
    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedTask) return res.status(404).json({ success: false, error: 'Task not found' });
    res.json({ success: true, data: updatedTask });
  } catch (err) {
    console.error('Error updating task:', err);
    res.status(400).json({ success: false, error: err.message });
  }
});

// Delete task (public for testing)
router.delete('/:id', async (req, res) => {
  try {
    const deletedTask = await Task.findByIdAndDelete(req.params.id);
    if (!deletedTask) return res.status(404).json({ success: false, error: 'Task not found' });
    res.json({ success: true, message: 'Task deleted' });
  } catch (err) {
    console.error('Error deleting task:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router; 