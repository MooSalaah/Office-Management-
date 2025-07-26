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

// Seed default task types
router.post('/seed', async (req, res) => {
  try {
    const defaultTaskTypes = [
      {
        name: "رسم مخططات معمارية",
        description: "رسم المخططات المعمارية الأساسية للمشروع",
        isDefault: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        name: "قرار مساحي",
        description: "إعداد القرار المساحي للمشروع",
        isDefault: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        name: "عمل فكرة مخطط معماري",
        description: "تطوير الفكرة الأولية للمخطط المعماري",
        isDefault: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        name: "مخطط سلامة",
        description: "إعداد مخطط السلامة للمشروع",
        isDefault: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        name: "رفع الرخصة",
        description: "رفع طلب الرخصة البلدية",
        isDefault: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        name: "مخطط انشائي",
        description: "إعداد المخططات الإنشائية",
        isDefault: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        name: "منظور 3D",
        description: "إنشاء منظور ثلاثي الأبعاد للمشروع",
        isDefault: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    // Clear existing default task types
    await TaskType.deleteMany({ isDefault: true });

    // Insert new default task types
    const insertedTaskTypes = await TaskType.insertMany(defaultTaskTypes);
    
    res.json({ 
      success: true, 
      message: 'Default task types seeded successfully',
      data: insertedTaskTypes
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router; 