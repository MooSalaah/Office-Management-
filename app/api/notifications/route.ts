import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    // Connect to MongoDB and fetch notifications
    const { MongoClient } = require('mongodb');
    const uri = process.env.MONGODB_URI;
    
    if (!uri) {
      console.error('MONGODB_URI not found in environment variables');
      return NextResponse.json({ success: false, error: 'Database connection not configured' }, { status: 500 });
    }

    const client = new MongoClient(uri);
    await client.connect();
    
    const database = client.db('test');
    const notifications = database.collection('notifications');
    
    // Fetch all notifications from database with sorting by createdAt
    const notificationsList = await notifications.find({})
      .sort({ createdAt: -1 }) // ترتيب تنازلي حسب تاريخ الإنشاء
      .toArray();
    
    await client.close();
    
    // تحويل _id إلى id للتوافق مع الواجهة
    const formattedNotifications = notificationsList.map((notification: any) => ({
      ...notification,
      id: notification._id?.toString() || notification.id || Date.now().toString(),
      _id: notification._id?.toString() // إبقاء _id كـ string أيضاً
    }));
    
    return NextResponse.json({ 
      success: true, 
      data: formattedNotifications,
      count: formattedNotifications.length
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch notifications',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.userId || !body.title || !body.message || !body.type) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields: userId, title, message, type',
        received: { userId: !!body.userId, title: !!body.title, message: !!body.message, type: !!body.type }
      }, { status: 400 });
    }

    // Validate notification type
    const validTypes = ['task', 'project', 'finance', 'system', 'attendance', 'client'];
    if (!validTypes.includes(body.type)) {
      return NextResponse.json({ 
        success: false, 
        error: `Invalid notification type. Must be one of: ${validTypes.join(', ')}`,
        received: body.type
      }, { status: 400 });
    }

    const newNotification = {
      id: Date.now().toString(),
      userId: body.userId,
      title: body.title,
      message: body.message,
      type: body.type,
      isRead: body.isRead || false,
      actionUrl: body.actionUrl || null,
      triggeredBy: body.triggeredBy || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Connect to MongoDB and save notification
    const { MongoClient } = require('mongodb');
    const uri = process.env.MONGODB_URI;
    
    if (!uri) {
      console.error('MONGODB_URI not found in environment variables');
      return NextResponse.json({ success: false, error: 'Database connection not configured' }, { status: 500 });
    }

    const client = new MongoClient(uri);
    await client.connect();
    
    const database = client.db('test');
    const notifications = database.collection('notifications');
    
    // Save notification to database
    const result = await notifications.insertOne(newNotification);
    
    await client.close();
    
    console.log('Notification created successfully:', { 
      id: newNotification.id, 
      userId: newNotification.userId, 
      type: newNotification.type 
    });
    
    return NextResponse.json({ 
      success: true, 
      data: { ...newNotification, _id: result.insertedId },
      message: 'Notification created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to create notification',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 