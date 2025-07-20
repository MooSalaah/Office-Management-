import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const dataDir = path.join(process.cwd(), "data");
const clientsFile = path.join(dataDir, "clients.json");

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
	fs.mkdirSync(dataDir, { recursive: true });
}

export async function GET() {
	try {
		if (!fs.existsSync(clientsFile)) {
			return NextResponse.json({ success: true, data: [] });
		}

		const clientsData = fs.readFileSync(clientsFile, "utf8");
		const clients = JSON.parse(clientsData);

		return NextResponse.json({ success: true, data: clients });
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
		console.log("POST /api/clients - Starting client creation");

		const clientData = await request.json();
		console.log("Client data received:", clientData);

		// Ensure data directory exists
		if (!fs.existsSync(dataDir)) {
			console.log("Creating data directory:", dataDir);
			fs.mkdirSync(dataDir, { recursive: true });
		}

		// Load existing clients
		let clients = [];
		if (fs.existsSync(clientsFile)) {
			console.log("Loading existing clients from:", clientsFile);
			const existingData = fs.readFileSync(clientsFile, "utf8");
			clients = JSON.parse(existingData);
			console.log("Existing clients count:", clients.length);
		} else {
			console.log("No existing clients file found, starting fresh");
		}

		// Add new client
		clients.push(clientData);
		console.log("Client added to array, total clients:", clients.length);

		// Save to file
		const fileContent = JSON.stringify(clients, null, 2);
		fs.writeFileSync(clientsFile, fileContent);
		console.log("Clients saved to file:", clientsFile);

		console.log("Client created successfully:", clientData);

		return NextResponse.json({
			success: true,
			message: "Client created successfully",
			data: clientData,
		});
	} catch (error) {
		console.error("Error creating client:", error);
		return NextResponse.json(
			{
				success: false,
				error: "Failed to create client",
				details: error instanceof Error ? error.message : "Unknown error",
			},
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

		// Load existing clients
		let clients = [];
		if (fs.existsSync(clientsFile)) {
			const existingData = fs.readFileSync(clientsFile, "utf8");
			clients = JSON.parse(existingData);
		}

		// Update client
		const clientIndex = clients.findIndex((c: any) => c.id === id);
		if (clientIndex === -1) {
			return NextResponse.json(
				{ success: false, error: "Client not found" },
				{ status: 404 }
			);
		}

		clients[clientIndex] = { ...clients[clientIndex], ...clientData };

		// Save to file
		fs.writeFileSync(clientsFile, JSON.stringify(clients, null, 2));

		console.log("Client updated successfully:", clientData);

		return NextResponse.json({
			success: true,
			message: "Client updated successfully",
			data: clients[clientIndex],
		});
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

		// Load existing clients
		let clients = [];
		if (fs.existsSync(clientsFile)) {
			const existingData = fs.readFileSync(clientsFile, "utf8");
			clients = JSON.parse(existingData);
		}

		// Remove client
		const filteredClients = clients.filter((c: any) => c.id !== id);

		// Save to file
		fs.writeFileSync(clientsFile, JSON.stringify(filteredClients, null, 2));

		console.log("Client deleted successfully:", id);

		return NextResponse.json({
			success: true,
			message: "Client deleted successfully",
		});
	} catch (error) {
		console.error("Error deleting client:", error);
		return NextResponse.json(
			{ success: false, error: "Failed to delete client" },
			{ status: 500 }
		);
	}
}
