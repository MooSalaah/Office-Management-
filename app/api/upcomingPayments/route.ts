import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export async function GET() {
	try {
		const response = await fetch(`${BACKEND_URL}/api/upcomingPayments`);
		const data = await response.json();
		return NextResponse.json(data);
	} catch (error) {
		console.error("Error fetching upcoming payments:", error);
		return NextResponse.json(
			{ success: false, error: "Failed to fetch upcoming payments" },
			{ status: 500 }
		);
	}
}

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const response = await fetch(`${BACKEND_URL}/api/upcomingPayments`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(body),
		});
		const data = await response.json();
		return NextResponse.json(data);
	} catch (error) {
		console.error("Error creating upcoming payment:", error);
		return NextResponse.json(
			{ success: false, error: "Failed to create upcoming payment" },
			{ status: 500 }
		);
	}
} 