import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export async function POST(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const body = await request.json();
		const response = await fetch(`${BACKEND_URL}/api/upcomingPayments/${params.id}/complete`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(body),
		});
		const data = await response.json();
		return NextResponse.json(data);
	} catch (error) {
		console.error("Error completing upcoming payment:", error);
		return NextResponse.json(
			{ success: false, error: "Failed to complete upcoming payment" },
			{ status: 500 }
		);
	}
} 