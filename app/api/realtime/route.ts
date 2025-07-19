import { NextRequest, NextResponse } from "next/server";

// Store connected clients
const clients = new Set<ReadableStreamDefaultController>();

export async function GET() {
	const stream = new ReadableStream({
		start(controller) {
			// Add client to the set
			clients.add(controller);

			// Send initial connection message
			controller.enqueue(
				new TextEncoder().encode(
					`data: ${JSON.stringify({
						type: "connection",
						message: "Connected to realtime updates",
						timestamp: Date.now(),
					})}\n\n`
				)
			);
		},
	});

	return new NextResponse(stream, {
		headers: {
			"Content-Type": "text/event-stream",
			"Cache-Control": "no-cache",
			Connection: "keep-alive",
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Headers": "Cache-Control",
		},
	});
}

export async function POST(request: NextRequest) {
	try {
		const update = await request.json();

		// Broadcast to all connected clients
		const message = `data: ${JSON.stringify(update)}\n\n`;

		clients.forEach((client) => {
			try {
				client.enqueue(new TextEncoder().encode(message));
			} catch (error) {
				// Remove disconnected client
				clients.delete(client);
			}
		});

		return NextResponse.json({ success: true, clientsCount: clients.size });
	} catch (error) {
		console.error("Error broadcasting update:", error);
		return NextResponse.json(
			{ error: "Failed to broadcast update" },
			{ status: 500 }
		);
	}
}
