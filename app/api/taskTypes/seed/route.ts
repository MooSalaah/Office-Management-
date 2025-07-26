import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://office-management-fsy7.onrender.com';

export async function POST(request: NextRequest) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/taskTypes/seed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error seeding task types:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to seed task types' },
      { status: 500 }
    );
  }
} 