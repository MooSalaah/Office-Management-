import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const dataDir = path.join(process.cwd(), "data");
const attendanceFile = path.join(dataDir, "attendance.json");

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
	fs.mkdirSync(dataDir, { recursive: true });
}

export async function GET() {
	try {
		if (!fs.existsSync(attendanceFile)) {
			return NextResponse.json({ success: true, data: [] });
		}

		const attendanceData = fs.readFileSync(attendanceFile, "utf8");
		const attendance = JSON.parse(attendanceData);

		return NextResponse.json({ success: true, data: attendance });
	} catch (error) {
		console.error("Error fetching attendance:", error);
		return NextResponse.json(
			{ success: false, error: "Failed to fetch attendance" },
			{ status: 500 }
		);
	}
}

export async function POST(request: NextRequest) {
	try {
		const attendanceData = await request.json();

		// Load existing attendance records
		let attendance = [];
		if (fs.existsSync(attendanceFile)) {
			const existingData = fs.readFileSync(attendanceFile, "utf8");
			attendance = JSON.parse(existingData);
		}

		// Add new attendance record
		attendance.push(attendanceData);

		// Save to file
		fs.writeFileSync(attendanceFile, JSON.stringify(attendance, null, 2));

		console.log("Attendance record created successfully:", attendanceData);

		return NextResponse.json({
			success: true,
			message: "Attendance record created successfully",
			data: attendanceData,
		});
	} catch (error) {
		console.error("Error creating attendance record:", error);
		return NextResponse.json(
			{ success: false, error: "Failed to create attendance record" },
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
				{ success: false, error: "Attendance ID is required" },
				{ status: 400 }
			);
		}

		const attendanceData = await request.json();

		// Load existing attendance records
		let attendance = [];
		if (fs.existsSync(attendanceFile)) {
			const existingData = fs.readFileSync(attendanceFile, "utf8");
			attendance = JSON.parse(existingData);
		}

		// Update attendance record
		const recordIndex = attendance.findIndex((r: any) => r.id === id);
		if (recordIndex === -1) {
			return NextResponse.json(
				{ success: false, error: "Attendance record not found" },
				{ status: 404 }
			);
		}

		attendance[recordIndex] = { ...attendance[recordIndex], ...attendanceData };

		// Save to file
		fs.writeFileSync(attendanceFile, JSON.stringify(attendance, null, 2));

		console.log("Attendance record updated successfully:", attendanceData);

		return NextResponse.json({
			success: true,
			message: "Attendance record updated successfully",
			data: attendance[recordIndex],
		});
	} catch (error) {
		console.error("Error updating attendance record:", error);
		return NextResponse.json(
			{ success: false, error: "Failed to update attendance record" },
			{ status: 500 }
		);
	}
}
