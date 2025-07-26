import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://office-management-fsy7.onrender.com';

export async function GET() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/taskTypes`);
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching task types:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch task types' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const response = await fetch(`${BACKEND_URL}/api/taskTypes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating task type:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create task type' },
      { status: 500 }
    );
  }
} 