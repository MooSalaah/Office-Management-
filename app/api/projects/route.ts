import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export async function GET() {
	try {
		const response = await fetch(`${BACKEND_URL}/api/projects`);
		const data = await response.json();
		return NextResponse.json(data);
	} catch (error) {
		console.error("Error fetching projects:", error);
		return NextResponse.json(
			{ success: false, error: "Failed to fetch projects" },
			{ status: 500 }
		);
	}
}

export async function POST(request: NextRequest) {
	try {
		const projectData = await request.json();
		const response = await fetch(`${BACKEND_URL}/api/projects`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(projectData),
		});
		const data = await response.json();
		return NextResponse.json(data);
	} catch (error) {
		console.error("Error creating project:", error);
		return NextResponse.json(
			{ success: false, error: "Failed to create project" },
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
				{ success: false, error: "Project ID is required" },
				{ status: 400 }
			);
		}

		const projectData = await request.json();
		const response = await fetch(`${BACKEND_URL}/api/projects/${id}`, {
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(projectData),
		});
		const data = await response.json();
		return NextResponse.json(data);
	} catch (error) {
		console.error("Error updating project:", error);
		return NextResponse.json(
			{ success: false, error: "Failed to update project" },
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
				{ success: false, error: "Project ID is required" },
				{ status: 400 }
			);
		}

		const response = await fetch(`${BACKEND_URL}/api/projects/${id}`, {
			method: "DELETE",
		});
		const data = await response.json();
		return NextResponse.json(data);
	} catch (error) {
		console.error("Error deleting project:", error);
		return NextResponse.json(
			{ success: false, error: "Failed to delete project" },
			{ status: 500 }
		);
	}
}
