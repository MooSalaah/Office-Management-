const User = require('../models/User');
const logger = require('../logger');

const CLEANUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours
const DELETE_AFTER_DAYS = 7;

const startCleanupJob = () => {
    logger.info('Starting user cleanup job...', undefined, 'JOBS');

    // Run immediately on startup
    cleanupUsers();

    // Schedule periodic run
    setInterval(cleanupUsers, CLEANUP_INTERVAL);
};

const cleanupUsers = async () => {
    try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - DELETE_AFTER_DAYS);

        const result = await User.deleteMany({
            deletedAt: { $ne: null, $lt: cutoffDate }
        });

        if (result.deletedCount > 0) {
            logger.info(`Cleaned up ${result.deletedCount} soft-deleted users`, undefined, 'JOBS');
        }
    } catch (error) {
        logger.error('Error running user cleanup job', { error: error.message }, 'JOBS');
    }
};

module.exports = { startCleanupJob };
