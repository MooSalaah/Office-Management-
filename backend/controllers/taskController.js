const mongoose = require('mongoose');
const Task = require('../models/Task');
const Project = require('../models/Project');
const Notification = require('../models/Notification');

async function updateTask(req, res) {
    const taskId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
        return res.status(400).json({ success: false, error: 'Invalid task id' });
    }

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        // Get original task to check for status changes
        const originalTask = await Task.findById(taskId).session(session);
        if (!originalTask) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ success: false, error: 'Task not found' });
        }

        // Update task
        const updates = req.body;
        const task = await Task.findByIdAndUpdate(taskId, updates, { new: true, session });

        // Notification Logic
        if (updates.status && updates.status !== originalTask.status) {
            const statusArabic = {
                'todo': 'قيد الانتظار',
                'in-progress': 'جاري العمل',
                'completed': 'مكتملة'
            };

            const actorName = req.user ? req.user.name : 'مستخدم';
            const statusText = statusArabic[updates.status] || updates.status;

            // Notify assignee if it's not the actor
            if (task.assigneeId && task.assigneeId !== (req.user ? req.user.id : '')) {
                const notification = new Notification({
                    userId: task.assigneeId,
                    title: "تحديث حالة مهمة",
                    message: `تم تحديث حالة مهمة "${task.title}" إلى ${statusText} بواسطة ${actorName}`,
                    type: "task",
                    isRead: false,
                    actionUrl: `/tasks`,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });
                await notification.save({ session });
            }
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
            // Calculate progress
            const progress = totalTasks === 0 ? 0 : Math.round(((totalTasks - incompleteTasks) / totalTasks) * 100);

            // Determine new status
            // We only auto-complete if progress is 100%
            // We do NOT auto-revert from completed to in-progress here to avoid fighting with manual completion
            let newStatus = undefined; // undefined means don't change status by default

            const currentProject = await Project.findById(projectId).session(session);
            if (currentProject) {
                if (progress === 100 && currentProject.status !== 'canceled') {
                    newStatus = 'completed';
                } else if (progress < 100 && currentProject.status === 'completed') {
                    // If project is completed but tasks are not, keep it completed (manual override)
                    // OR we could decide to revert it. The user complaint says "reverts to in-progress", so we should STOP doing that.
                    newStatus = 'completed';
                } else if (progress > 0 && currentProject.status === 'draft') {
                    newStatus = 'in-progress';
                } else {
                    newStatus = currentProject.status;
                }
            }

            const updatedProject = await Project.findByIdAndUpdate(projectId, { progress, status: newStatus }, { session, new: true });

            // Broadcast Project Update
            if (updatedProject) {
                try {
                    const fetch = require('node-fetch');
                    await fetch(`${req.protocol}://${req.get('host')}/api/realtime/broadcast`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            type: 'project',
                            action: 'update',
                            data: updatedProject,
                            userId: req.user ? req.user.id : 'system',
                            timestamp: Date.now()
                        })
                    });
                } catch (broadcastError) {
                    console.error('Project broadcast error', broadcastError);
                }
            }
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
