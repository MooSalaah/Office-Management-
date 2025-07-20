import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export async function GET() {
	try {
		const response = await fetch(`${BACKEND_URL}/api/clients`);
		const data = await response.json();
		return NextResponse.json(data);
	} catch (error) {
		console.error("Error fetching clients:", error);
		return NextResponse.json(
			{ success: false, error: "Failed to fetch clients" },
			{ status: 500 }
		);
	}
}

export async function POST(request: NextRequest) {
	try {
		const clientData = await request.json();
		const response = await fetch(`${BACKEND_URL}/api/clients`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(clientData),
		});
		const data = await response.json();
		return NextResponse.json(data);
	} catch (error) {
		console.error("Error creating client:", error);
		return NextResponse.json(
			{ success: false, error: "Failed to create client" },
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
				{ success: false, error: "Client ID is required" },
				{ status: 400 }
			);
		}

		const clientData = await request.json();
		const response = await fetch(`${BACKEND_URL}/api/clients/${id}`, {
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(clientData),
		});
		const data = await response.json();
		return NextResponse.json(data);
	} catch (error) {
		console.error("Error updating client:", error);
		return NextResponse.json(
			{ success: false, error: "Failed to update client" },
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
				{ success: false, error: "Client ID is required" },
				{ status: 400 }
			);
		}

		const response = await fetch(`${BACKEND_URL}/api/clients/${id}`, {
			method: "DELETE",
		});
		const data = await response.json();
		return NextResponse.json(data);
	} catch (error) {
		console.error("Error deleting client:", error);
		return NextResponse.json(
			{ success: false, error: "Failed to delete client" },
			{ status: 500 }
		);
	}
}
