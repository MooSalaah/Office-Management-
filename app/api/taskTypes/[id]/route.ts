import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://office-management-fsy7.onrender.com';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const response = await fetch(`${BACKEND_URL}/api/taskTypes/${params.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating task type:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update task type' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/taskTypes/${params.id}`, {
      method: 'DELETE',
    });
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error deleting task type:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete task type' },
      { status: 500 }
    );
  }
} 