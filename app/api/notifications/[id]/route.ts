import { NextRequest, NextResponse } from 'next/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const notificationId = params.id;

    // Connect to MongoDB and update notification
    const { MongoClient, ObjectId } = require('mongodb');
    const uri = process.env.MONGODB_URI;
    
    if (!uri) {
      console.error('MONGODB_URI not found in environment variables');
      return NextResponse.json({ success: false, error: 'Database connection not configured' }, { status: 500 });
    }

    const client = new MongoClient(uri);
    await client.connect();
    
    const database = client.db('test');
    const notifications = database.collection('notifications');
    
    // Update notification in database
    const result = await notifications.updateOne(
      { _id: new ObjectId(notificationId) },
      { $set: body }
    );
    
    await client.close();
    
    if (result.matchedCount === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Notification not found' 
      }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Notification updated successfully' 
    });
  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to update notification' 
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const notificationId = params.id;

    // Connect to MongoDB and delete notification
    const { MongoClient, ObjectId } = require('mongodb');
    const uri = process.env.MONGODB_URI;
    
    if (!uri) {
      console.error('MONGODB_URI not found in environment variables');
      return NextResponse.json({ success: false, error: 'Database connection not configured' }, { status: 500 });
    }

    const client = new MongoClient(uri);
    await client.connect();
    
    const database = client.db('test');
    const notifications = database.collection('notifications');
    
    // Delete notification from database
    const result = await notifications.deleteOne({ _id: new ObjectId(notificationId) });
    
    await client.close();
    
    if (result.deletedCount === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Notification not found' 
      }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Notification deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to delete notification' 
    }, { status: 500 });
  }
} 