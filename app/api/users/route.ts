import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export async function GET() {
	try {
		const response = await fetch(`${BACKEND_URL}/api/users`);
		const data = await response.json();
		return NextResponse.json(data);
	} catch (error) {
		console.error("Error fetching users:", error);
		return NextResponse.json(
			{ success: false, error: "Failed to fetch users" },
			{ status: 500 }
		);
	}
}

export async function POST(request: NextRequest) {
	try {
		const userData = await request.json();
		const response = await fetch(`${BACKEND_URL}/api/users`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(userData),
		});
		const data = await response.json();
		return NextResponse.json(data);
	} catch (error) {
		console.error("Error creating user:", error);
		return NextResponse.json(
			{ success: false, error: "Failed to create user" },
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
				{ success: false, error: "User ID is required" },
				{ status: 400 }
			);
		}

		const userData = await request.json();
		const response = await fetch(`${BACKEND_URL}/api/users/${id}`, {
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(userData),
		});
		const data = await response.json();
		return NextResponse.json(data);
	} catch (error) {
		console.error("Error updating user:", error);
		return NextResponse.json(
			{ success: false, error: "Failed to update user" },
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
				{ success: false, error: "User ID is required" },
				{ status: 400 }
			);
		}

		const response = await fetch(`${BACKEND_URL}/api/users/${id}`, {
			method: "DELETE",
		});
		const data = await response.json();
		return NextResponse.json(data);
	} catch (error) {
		console.error("Error deleting user:", error);
		return NextResponse.json(
			{ success: false, error: "Failed to delete user" },
			{ status: 500 }
		);
	}
}
