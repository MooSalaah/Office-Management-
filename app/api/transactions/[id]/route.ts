import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export async function PUT(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const body = await request.json();
		const response = await fetch(`${BACKEND_URL}/api/transactions/${params.id}`, {
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(body),
		});
		const data = await response.json();
		return NextResponse.json(data);
	} catch (error) {
		console.error("Error updating transaction:", error);
		return NextResponse.json(
			{ success: false, error: "Failed to update transaction" },
			{ status: 500 }
		);
	}
}

export async function DELETE(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		const response = await fetch(`${BACKEND_URL}/api/transactions/${params.id}`, {
			method: "DELETE",
		});
		const data = await response.json();
		return NextResponse.json(data);
	} catch (error) {
		console.error("Error deleting transaction:", error);
		return NextResponse.json(
			{ success: false, error: "Failed to delete transaction" },
			{ status: 500 }
		);
	}
} 