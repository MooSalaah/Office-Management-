import { NextRequest, NextResponse } from "next/server";

// Mock database for notifications (in production, use MongoDB)
let notifications: any[] = [];

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const updates = await request.json();
    
    const notificationIndex = notifications.findIndex(n => n.id === id);
    if (notificationIndex === -1) {
      return NextResponse.json(
        { success: false, error: "Notification not found" },
        { status: 404 }
      );
    }
    
    // Update notification
    notifications[notificationIndex] = { ...notifications[notificationIndex], ...updates };
    
    return NextResponse.json({ 
      success: true, 
      data: notifications[notificationIndex] 
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to update notification" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    const notificationIndex = notifications.findIndex(n => n.id === id);
    if (notificationIndex === -1) {
      return NextResponse.json(
        { success: false, error: "Notification not found" },
        { status: 404 }
      );
    }
    
    // Delete notification
    const deletedNotification = notifications.splice(notificationIndex, 1)[0];
    
    return NextResponse.json({ 
      success: true, 
      message: "Notification deleted",
      data: deletedNotification
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to delete notification" },
      { status: 500 }
    );
  }
} 