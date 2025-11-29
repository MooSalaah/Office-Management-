const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const Notification = require('../models/Notification');

const clearNotifications = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI;

        console.log('🔗 Connecting to MongoDB...');
        await mongoose.connect(mongoURI);
        console.log('✅ Connected to MongoDB');

        console.log('🗑️ Clearing all notifications...');
        const result = await Notification.deleteMany({});
        console.log(`✅ Deleted ${result.deletedCount} notifications.`);

        await mongoose.disconnect();
        console.log('👋 Disconnected from MongoDB');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error clearing notifications:', error);
        process.exit(1);
    }
};

clearNotifications();
