import { NextRequest, NextResponse } from "next/server";

// Mock database for notifications (in production, use MongoDB)
let notifications: any[] = [];

export async function GET() {
  try {
    return NextResponse.json({ 
      success: true, 
      data: notifications 
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const notification = await request.json();
    
    // Validate notification
    if (!notification.userId || !notification.title || !notification.message || !notification.type) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    // Add to mock database
    notifications.push(notification);
    
    return NextResponse.json(
      { success: true, data: notification },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to create notification" },
      { status: 500 }
    );
  }
} 