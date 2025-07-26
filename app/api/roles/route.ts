import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    // Connect to MongoDB and fetch roles
    const { MongoClient } = require('mongodb');
    const uri = process.env.MONGODB_URI;
    
    if (!uri) {
      console.error('MONGODB_URI not found in environment variables');
      return NextResponse.json({ success: false, error: 'Database connection not configured' }, { status: 500 });
    }

    const client = new MongoClient(uri);
    await client.connect();
    
    const database = client.db('test');
    const roles = database.collection('roles');
    
    // Fetch all roles from database
    const rolesList = await roles.find({}).toArray();
    
    await client.close();
    
    return NextResponse.json({ 
      success: true, 
      data: rolesList 
    });
  } catch (error) {
    console.error('Error fetching roles:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch roles' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.permissions) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields: name, permissions' 
      }, { status: 400 });
    }

    const newRole = {
      id: body.id || Date.now().toString(),
      name: body.name,
      description: body.description || '',
      permissions: body.permissions,
      modules: body.modules || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Connect to MongoDB and save role
    const { MongoClient } = require('mongodb');
    const uri = process.env.MONGODB_URI;
    
    if (!uri) {
      console.error('MONGODB_URI not found in environment variables');
      return NextResponse.json({ success: false, error: 'Database connection not configured' }, { status: 500 });
    }

    const client = new MongoClient(uri);
    await client.connect();
    
    const database = client.db('test');
    const roles = database.collection('roles');
    
    // Check if role with same name already exists
    const existingRole = await roles.findOne({ name: newRole.name });
    if (existingRole) {
      await client.close();
      return NextResponse.json({ 
        success: false, 
        error: 'Role with this name already exists' 
      }, { status: 400 });
    }
    
    // Save role to database
    const result = await roles.insertOne(newRole);
    
    await client.close();
    
    return NextResponse.json({ 
      success: true, 
      data: { ...newRole, _id: result.insertedId } 
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating role:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to create role' 
    }, { status: 500 });
  }
} 