import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const dataDir = path.join(process.cwd(), "data");
const notificationsSettingsFile = path.join(
	dataDir,
	"notifications-settings.json"
);

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
	fs.mkdirSync(dataDir, { recursive: true });
}

export async function POST(request: NextRequest) {
	try {
		const notificationSettings = await request.json();

		// Load existing settings
		let allSettings: { [key: string]: any } = {};
		if (fs.existsSync(notificationsSettingsFile)) {
			const existingData = fs.readFileSync(notificationsSettingsFile, "utf8");
			allSettings = JSON.parse(existingData);
		}

		// Update settings for specific user
		allSettings[notificationSettings.userId] =
			notificationSettings.notificationSettings;

		// Save updated settings to file
		fs.writeFileSync(
			notificationsSettingsFile,
			JSON.stringify(allSettings, null, 2)
		);

		console.log(
			"Notification settings saved successfully:",
			notificationSettings
		);

		return NextResponse.json({
			success: true,
			message: "Notification settings saved successfully",
			data: notificationSettings,
		});
	} catch (error) {
		console.error("Error saving notification settings:", error);
		return NextResponse.json(
			{
				success: false,
				error: "Failed to save notification settings",
			},
			{ status: 500 }
		);
	}
}

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const userId = searchParams.get("userId");

		if (!fs.existsSync(notificationsSettingsFile)) {
			return NextResponse.json({
				success: true,
				data: {},
			});
		}

		const settingsData = fs.readFileSync(notificationsSettingsFile, "utf8");
		const allSettings = JSON.parse(settingsData);

		if (userId && allSettings[userId]) {
			return NextResponse.json({
				success: true,
				data: allSettings[userId],
			});
		}

		return NextResponse.json({
			success: true,
			data: allSettings,
		});
	} catch (error) {
		console.error("Error loading notification settings:", error);
		return NextResponse.json(
			{
				success: false,
				error: "Failed to load notification settings",
			},
			{ status: 500 }
		);
	}
}
