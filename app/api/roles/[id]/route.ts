import { NextRequest, NextResponse } from 'next/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const roleId = params.id;

    // Connect to MongoDB and update role
    const { MongoClient, ObjectId } = require('mongodb');
    const uri = process.env.MONGODB_URI;
    
    if (!uri) {
      console.error('MONGODB_URI not found in environment variables');
      return NextResponse.json({ success: false, error: 'Database connection not configured' }, { status: 500 });
    }

    const client = new MongoClient(uri);
    await client.connect();
    
    const database = client.db('test');
    const roles = database.collection('roles');
    
    // Update role in database
    const result = await roles.updateOne(
      { _id: new ObjectId(roleId) },
      { 
        $set: {
          ...body,
          updatedAt: new Date().toISOString()
        }
      }
    );
    
    await client.close();
    
    if (result.matchedCount === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Role not found' 
      }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Role updated successfully' 
    });
  } catch (error) {
    console.error('Error updating role:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to update role' 
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const roleId = params.id;

    // Connect to MongoDB and delete role
    const { MongoClient, ObjectId } = require('mongodb');
    const uri = process.env.MONGODB_URI;
    
    if (!uri) {
      console.error('MONGODB_URI not found in environment variables');
      return NextResponse.json({ success: false, error: 'Database connection not configured' }, { status: 500 });
    }

    const client = new MongoClient(uri);
    await client.connect();
    
    const database = client.db('test');
    const roles = database.collection('roles');
    
    // Delete role from database
    const result = await roles.deleteOne({ _id: new ObjectId(roleId) });
    
    await client.close();
    
    if (result.deletedCount === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Role not found' 
      }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Role deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting role:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to delete role' 
    }, { status: 500 });
  }
} 