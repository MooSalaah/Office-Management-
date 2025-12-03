const mongoose = require('mongoose');
const Project = require('../models/Project');
const Task = require('../models/Task');

async function updateProject(req, res) {
    const projectId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        return res.status(400).json({ success: false, error: 'Invalid project id' });
    }

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const updates = req.body;
        const project = await Project.findByIdAndUpdate(projectId, updates, { new: true, session });
        if (!project) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ success: false, error: 'Project not found' });
        }

        // If status is completed, mark all tasks as completed
        if (updates.status === 'completed') {
            await Task.updateMany({ projectId }, { status: 'completed' }, { session });

            // set progress to 100 explicitly
            project.progress = 100;
            await project.save({ session });
        } else {
            // If status changed to non-completed, recalculate progress
            const totalTasks = await Task.countDocuments({ projectId }).session(session);
            const incompleteTasks = await Task.countDocuments({ projectId, status: { $ne: 'completed' } }).session(session);
            const progress = totalTasks === 0 ? 0 : Math.round(((totalTasks - incompleteTasks) / totalTasks) * 100);
            project.progress = progress;
            await project.save({ session });
        }

        await session.commitTransaction();
        session.endSession();

        // Broadcast Project Update
        try {
            const fetch = require('node-fetch');
            await fetch(`${req.protocol}://${req.get('host')}/api/realtime/broadcast`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'project',
                    action: 'update',
                    data: project,
                    userId: req.user ? req.user.id : 'system',
                    timestamp: Date.now()
                })
            });

            // If tasks were updated, broadcast task updates
            if (updates.status === 'completed') {
                const updatedTasks = await Task.find({ projectId });
                for (const task of updatedTasks) {
                    await fetch(`${req.protocol}://${req.get('host')}/api/realtime/broadcast`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            type: 'task',
                            action: 'update',
                            data: task,
                            userId: req.user ? req.user.id : 'system',
                            timestamp: Date.now()
                        })
                    });
                }
            }
        } catch (broadcastError) {
            console.error('Broadcast error', broadcastError);
        }

        return res.json({ success: true, data: project });
    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        console.error('updateProject error', err);
        return res.status(500).json({ success: false, error: err.message || 'Server error' });
    }
}

module.exports = { updateProject };
