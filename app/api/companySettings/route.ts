import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export async function GET() {
	try {
		const response = await fetch(`${BACKEND_URL}/api/companySettings`);
		const data = await response.json();
		return NextResponse.json(data);
	} catch (error) {
		console.error("Error fetching company settings:", error);
		return NextResponse.json(
			{ success: false, error: "Failed to fetch company settings" },
			{ status: 500 }
		);
	}
}

export async function PUT(request: NextRequest) {
	try {
		const body = await request.json();
		const response = await fetch(`${BACKEND_URL}/api/companySettings`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(body),
		});
		const data = await response.json();
		return NextResponse.json(data);
	} catch (error) {
		console.error("Error updating company settings:", error);
		return NextResponse.json(
			{ success: false, error: "Failed to update company settings" },
			{ status: 500 }
		);
	}
}

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const response = await fetch(`${BACKEND_URL}/api/companySettings`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(body),
		});
		const data = await response.json();
		return NextResponse.json(data);
	} catch (error) {
		console.error("Error creating company settings:", error);
		return NextResponse.json(
			{ success: false, error: "Failed to create company settings" },
			{ status: 500 }
		);
	}
} 