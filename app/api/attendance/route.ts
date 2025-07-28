import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export async function GET() {
	try {
		const response = await fetch(`${BACKEND_URL}/api/attendance`);
		const data = await response.json();
		return NextResponse.json(data);
	} catch (error) {
		console.error("Error fetching attendance:", error);
		return NextResponse.json(
			{ success: false, error: "Failed to fetch attendance" },
			{ status: 500 }
		);
	}
}

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const response = await fetch(`${BACKEND_URL}/api/attendance`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(body),
		});
		const data = await response.json();
		return NextResponse.json(data);
	} catch (error) {
		console.error("Error creating attendance:", error);
		return NextResponse.json(
			{ success: false, error: "Failed to create attendance" },
			{ status: 500 }
		);
	}
} 