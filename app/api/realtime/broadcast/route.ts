import { NextRequest, NextResponse } from "next/server";

// Store connected clients for broadcasting
const clients = new Set<ReadableStreamDefaultController>();

export async function POST(request: NextRequest) {
	try {
		const update = await request.json();

		// Validate update structure
		if (!update.type || !update.action || !update.data) {
			return NextResponse.json(
				{ error: "Invalid update structure" },
				{ status: 400 }
			);
		}

		// Add timestamp if not present
		if (!update.timestamp) {
			update.timestamp = Date.now();
		}

		// Broadcast to all connected clients
		const message = `data: ${JSON.stringify(update)}\n\n`;
		let broadcastCount = 0;

		clients.forEach((client) => {
			try {
				client.enqueue(new TextEncoder().encode(message));
				broadcastCount++;
			} catch (error) {
				// Remove disconnected client
				clients.delete(client);
			}
		});

		// Log broadcast for debugging
		console.log(
			`📡 Broadcasted ${update.type} ${update.action} to ${broadcastCount} clients`
		);

		return NextResponse.json({
			success: true,
			clientsCount: clients.size,
			broadcastCount,
			update: {
				type: update.type,
				action: update.action,
				timestamp: update.timestamp,
			},
		});
	} catch (error) {
		console.error("Error broadcasting update:", error);
		return NextResponse.json(
			{ error: "Failed to broadcast update" },
			{ status: 500 }
		);
	}
}

export async function GET() {
	return NextResponse.json({
		success: true,
		clientsCount: clients.size,
		message: "Broadcast endpoint is active",
	});
}
