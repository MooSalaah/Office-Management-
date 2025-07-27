import { NextRequest, NextResponse } from 'next/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const notificationId = params.id;

    // Validate notification ID
    if (!notificationId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Notification ID is required' 
      }, { status: 400 });
    }

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
    
    // Update notification in database - search by id field instead of _id
    const updateData = {
      ...body,
      updatedAt: new Date().toISOString()
    };
    
    const result = await notifications.updateOne(
      { id: notificationId }, // البحث بالـ id بدلاً من _id
      { $set: updateData }
    );
    
    await client.close();
    
    if (result.matchedCount === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Notification not found',
        notificationId: notificationId
      }, { status: 404 });
    }
    
    console.log('Notification updated successfully:', { 
      notificationId, 
      modifiedCount: result.modifiedCount 
    });
    
    return NextResponse.json({ 
      success: true, 
      message: 'Notification updated successfully',
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to update notification',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const notificationId = params.id;

    // Validate notification ID
    if (!notificationId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Notification ID is required' 
      }, { status: 400 });
    }

    // Connect to MongoDB and delete notification
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
    
    // Delete notification from database - search by id field instead of _id
    const result = await notifications.deleteOne({ id: notificationId }); // البحث بالـ id بدلاً من _id
    
    await client.close();
    
    if (result.deletedCount === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Notification not found',
        notificationId: notificationId
      }, { status: 404 });
    }
    
    console.log('Notification deleted successfully:', { 
      notificationId, 
      deletedCount: result.deletedCount 
    });
    
    return NextResponse.json({ 
      success: true, 
      message: 'Notification deleted successfully',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to delete notification',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 