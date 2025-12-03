const mongoose = require('mongoose');
const Task = require('../models/Task');
const Project = require('../models/Project');

async function updateTask(req, res) {
    const taskId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
        return res.status(400).json({ success: false, error: 'Invalid task id' });
    }

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        // Update task
        const updates = req.body;
        const task = await Task.findByIdAndUpdate(taskId, updates, { new: true, session });
        if (!task) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ success: false, error: 'Task not found' });
        }

        // Sync with Project
        if (task.projectId) {
            const projectId = task.projectId.toString();

            // Count total and incomplete tasks
            const [totalTasks, incompleteTasks] = await Promise.all([
                Task.countDocuments({ projectId }).session(session),
                Task.countDocuments({ projectId, status: { $ne: 'completed' } }).session(session)
            ]);

            // Calculate progress
            const progress = totalTasks === 0 ? 0 : Math.round(((totalTasks - incompleteTasks) / totalTasks) * 100);
            const newStatus = (progress === 100) ? 'completed' : (progress === 0 ? 'draft' : 'in-progress');

            await Project.findByIdAndUpdate(projectId, { progress, status: newStatus }, { session });
        }

        await session.commitTransaction();
        session.endSession();

        return res.json({ success: true, data: task });
    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        console.error('updateTask error', err);
        return res.status(500).json({ success: false, error: err.message || 'Server error' });
    }
}

module.exports = { updateTask };
