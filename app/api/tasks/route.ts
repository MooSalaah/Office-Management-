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

		// First, get the task to find its MongoDB _id
		const getResponse = await fetch(`${BACKEND_URL}/api/tasks`);
		const getData = await getResponse.json();
		
		if (!getData.success) {
			return NextResponse.json(
				{ success: false, error: "Failed to fetch tasks" },
				{ status: 500 }
			);
		}

		// Find the task by its id field
		const task = getData.data.find((t: any) => t.id === id);
		if (!task) {
			return NextResponse.json(
				{ success: false, error: "Task not found" },
				{ status: 404 }
			);
		}

		const taskData = await request.json();
		const response = await fetch(`${BACKEND_URL}/api/tasks/${task._id}`, {
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

		// First, get the task to find its MongoDB _id
		const getResponse = await fetch(`${BACKEND_URL}/api/tasks`);
		const getData = await getResponse.json();
		
		if (!getData.success) {
			return NextResponse.json(
				{ success: false, error: "Failed to fetch tasks" },
				{ status: 500 }
			);
		}

		// Find the task by its id field
		const task = getData.data.find((t: any) => t.id === id);
		if (!task) {
			return NextResponse.json(
				{ success: false, error: "Task not found" },
				{ status: 404 }
			);
		}

		// Delete using MongoDB _id
		const response = await fetch(`${BACKEND_URL}/api/tasks/${task._id}`, {
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
