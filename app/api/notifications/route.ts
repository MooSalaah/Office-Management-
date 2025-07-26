import { NextRequest, NextResponse } from 'next/server';

// Mock database for notifications
let notificationsDB: any[] = [
  {
    id: "1",
    userId: "1",
    title: "مرحباً بك في النظام",
    message: "تم تسجيل دخولك بنجاح إلى نظام إدارة المكتب",
    type: "system",
    isRead: false,
    actionUrl: "/dashboard",
    triggeredBy: "system",
    createdAt: new Date().toISOString()
  }
];

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
    
    // Fetch all notifications from database
    const notificationsList = await notifications.find({}).toArray();
    
    await client.close();
    
    return NextResponse.json({ 
      success: true, 
      data: notificationsList 
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch notifications' 
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
        error: 'Missing required fields: userId, title, message, type' 
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
      createdAt: new Date().toISOString()
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
    
    return NextResponse.json({ 
      success: true, 
      data: { ...newNotification, _id: result.insertedId } 
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to create notification' 
    }, { status: 500 });
  }
} 