import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const dataDir = path.join(process.cwd(), "data");
const settingsFile = path.join(dataDir, "settings.json");

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
	fs.mkdirSync(dataDir, { recursive: true });
}

export async function POST(request: NextRequest) {
	try {
		const settings = await request.json();

		// Save settings to file
		fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2));

		console.log("Settings saved successfully:", settings);

		return NextResponse.json({
			success: true,
			message: "Settings saved successfully",
			data: settings,
		});
	} catch (error) {
		console.error("Error saving settings:", error);
		return NextResponse.json(
			{
				success: false,
				error: "Failed to save settings",
			},
			{ status: 500 }
		);
	}
}

export async function GET() {
	try {
		if (!fs.existsSync(settingsFile)) {
			return NextResponse.json({
				success: true,
				data: {},
			});
		}

		const settingsData = fs.readFileSync(settingsFile, "utf8");
		const settings = JSON.parse(settingsData);

		return NextResponse.json({
			success: true,
			data: settings,
		});
	} catch (error) {
		console.error("Error loading settings:", error);
		return NextResponse.json(
			{
				success: false,
				error: "Failed to load settings",
			},
			{ status: 500 }
		);
	}
}
