import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const dataDir = path.join(process.cwd(), "data");
const companySettingsFile = path.join(dataDir, "company-settings.json");

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
	fs.mkdirSync(dataDir, { recursive: true });
}

export async function POST(request: NextRequest) {
	try {
		const companySettings = await request.json();

		// Save company settings to file
		fs.writeFileSync(
			companySettingsFile,
			JSON.stringify(companySettings, null, 2)
		);

		console.log("Company settings saved successfully:", companySettings);

		return NextResponse.json({
			success: true,
			message: "Company settings saved successfully",
			data: companySettings,
		});
	} catch (error) {
		console.error("Error saving company settings:", error);
		return NextResponse.json(
			{
				success: false,
				error: "Failed to save company settings",
			},
			{ status: 500 }
		);
	}
}

export async function GET() {
	try {
		if (!fs.existsSync(companySettingsFile)) {
			return NextResponse.json({
				success: true,
				data: {},
			});
		}

		const settingsData = fs.readFileSync(companySettingsFile, "utf8");
		const settings = JSON.parse(settingsData);

		return NextResponse.json({
			success: true,
			data: settings,
		});
	} catch (error) {
		console.error("Error loading company settings:", error);
		return NextResponse.json(
			{
				success: false,
				error: "Failed to load company settings",
			},
			{ status: 500 }
		);
	}
}
