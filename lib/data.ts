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
import { mockUsers as authMockUsers } from "./auth";

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

export const mockUsers: User[] = authMockUsers;

export const mockAttendanceRecords: AttendanceRecord[] = [];
