import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export async function GET() {
	try {
		const response = await fetch(`${BACKEND_URL}/api/tasks`);
		const data = await response.json();
		return NextResponse.json(data);
	} catch (error) {
		console.error("Error fetching tasks:", error);
		return NextResponse.json(
			{ success: false, error: "Failed to fetch tasks" },
			{ status: 500 }
		);
	}
}

export async function POST(request: NextRequest) {
	try {
		const taskData = await request.json();
		const response = await fetch(`${BACKEND_URL}/api/tasks`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(taskData),
		});
		const data = await response.json();
		return NextResponse.json(data);
	} catch (error) {
		console.error("Error creating task:", error);
		return NextResponse.json(
			{ success: false, error: "Failed to create task" },
			{ status: 500 }
		);
	}
}

export async function PUT(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const id = searchParams.get("id");
		if (!id) {
			return NextResponse.json(
				{ success: false, error: "Task ID is required" },
				{ status: 400 }
			);
		}

		const taskData = await request.json();
		const response = await fetch(`${BACKEND_URL}/api/tasks/${id}`, {
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(taskData),
		});
		const data = await response.json();
		return NextResponse.json(data);
	} catch (error) {
		console.error("Error updating task:", error);
		return NextResponse.json(
			{ success: false, error: "Failed to update task" },
			{ status: 500 }
		);
	}
}

export async function DELETE(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const id = searchParams.get("id");
		if (!id) {
			return NextResponse.json(
				{ success: false, error: "Task ID is required" },
				{ status: 400 }
			);
		}

		const response = await fetch(`${BACKEND_URL}/api/tasks/${id}`, {
			method: "DELETE",
		});
		const data = await response.json();
		return NextResponse.json(data);
	} catch (error) {
		console.error("Error deleting task:", error);
		return NextResponse.json(
			{ success: false, error: "Failed to delete task" },
			{ status: 500 }
		);
	}
}
