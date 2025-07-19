"use client";

import type {
	Project,
	Client,
	Task,
	Transaction,
	Notification,
	User,
	AttendanceRecord,
	CompanySettings,
} from "./types";

// Company Settings
export const companySettings: CompanySettings = {
	name: "الركن الجديد للاستشارات الهندسية",
	phone: "+966 11 123 4567",
	email: "info@newcorner.sa",
	address: "الرياض، المملكة العربية السعودية",
	website: "www.newcorner.sa",
	description: "مكتب استشارات هندسية متخصص في التصميم والإشراف",
};

// Mock data - في التطبيق الحقيقي سيكون من قاعدة البيانات
export const mockProjects: Project[] = [];

export const mockClients: Client[] = [];

export const mockTasks: Task[] = [];

export const mockTransactions: Transaction[] = [];

export const mockNotifications: Notification[] = [];

export const mockUsers: User[] = [
	{
		id: "1",
		name: "مصطفى صلاح",
		email: "admin@newcorner.sa",
		password: "admin123",
		role: "admin",
		phone: "+966501234567",
		isActive: true,
		createdAt: "2024-01-01",
		monthlySalary: 8000,
		workingHours: {
			morningStart: "08:00",
			morningEnd: "12:00",
			eveningStart: "16:00",
			eveningEnd: "21:00",
		},
	},
	{
		id: "u1001",
		name: "محمد مجدي",
		role: "engineer",
		monthlySalary: 3000,
		email: "m@nc.com",
		password: "mm",
		isActive: true,
		createdAt: new Date().toISOString(),
	},
	{
		id: "u1002",
		name: "عمرو رمضان",
		role: "engineer",
		monthlySalary: 2500,
		email: "a@nc.com",
		password: "ar",
		isActive: true,
		createdAt: new Date().toISOString(),
	},
	{
		id: "u1003",
		name: "كرم عبدالرحمن",
		role: "engineer",
		monthlySalary: 3000,
		email: "k@nc.com",
		password: "ka",
		isActive: true,
		createdAt: new Date().toISOString(),
	},
];

export const mockAttendanceRecords: AttendanceRecord[] = [];
