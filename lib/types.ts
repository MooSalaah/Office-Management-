export interface User {
	id: string;
	name: string;
	email: string;
	role: string;
	avatar?: string;
	phone?: string;
	isActive: boolean;
	createdAt: string;
	password?: string;
	permissions?: string[];
	monthlySalary?: number;
	workingHours?: {
		morningStart: string;
		morningEnd: string;
		eveningStart: string;
		eveningEnd: string;
	};
}

export interface Project {
	id: string;
	name: string;
	client: string;
	clientId: string;
	type: string;
	status: "draft" | "in-progress" | "completed" | "canceled";
	team: string[];
	startDate: string;
	startDateHijri?: string;
	price: number;
	downPayment: number;
	remainingBalance: number;
	assignedEngineerId: string;
	assignedEngineerName: string;
	importance: "low" | "medium" | "high";
	description: string;
	progress: number;
	createdBy: string;
	createdAt: string;
	updatedAt: string;
}

export interface Client {
	id: string;
	name: string;
	phone: string;
	email: string;
	address: string;
	notes?: string;
	projectsCount: number;
	totalValue: number;
	lastContact: string;
	status: "active" | "inactive" | "vip" | "government";
	createdAt: string;
	avatar?: string;
}

export interface Task {
	id: string;
	title: string;
	description?: string;
	assigneeId: string;
	assigneeName: string;
	projectId?: string;
	projectName?: string;
	priority: "low" | "medium" | "high";
	status: "todo" | "in-progress" | "completed";
	dueDate: string;
	createdBy: string;
	createdByName?: string;
	createdAt: string;
	updatedAt: string;
}

export interface Transaction {
	id: string;
	type: "income" | "expense";
	amount: number;
	description: string;
	clientId?: string;
	clientName?: string;
	projectId?: string;
	projectName?: string;
	category: string;
	transactionType:
		| "license"
		| "certificate"
		| "safety"
		| "consultation"
		| "design"
		| "supervision"
		| "maintenance"
		| "renovation"
		| "inspection"
		| "other";
	importance: "low" | "medium" | "high";
	paymentMethod?: "cash" | "transfer" | "pos";
	date: string;
	status: "completed" | "pending" | "draft" | "canceled";
	createdBy: string;
	createdAt: string;
	remainingAmount?: number;
	payerName?: string;
}

export interface Notification {
	id: string;
	userId: string;
	title: string;
	message: string;
	type: "task" | "project" | "finance" | "system" | "attendance" | "client";
	isRead: boolean;
	actionUrl?: string;
	triggeredBy: string;
	createdAt: string;
	updatedAt?: string;
}

export interface AttendanceRecord {
	id: string;
	userId: string;
	userName: string;
	checkIn?: string;
	checkOut?: string;
	session: "morning" | "evening";
	regularHours: number;
	lateHours: number;
	overtimeHours: number;
	totalHours: number;
	date: string;
	status: "present" | "absent" | "late" | "overtime";
	notes?: string;
	overtimePay?: number;
}

export interface CompanySettings {
	name: string;
	logo?: string;
	phone: string;
	email: string;
	address: string;
	website?: string;
	description: string;
}

export interface UpcomingPayment {
	id: string;
	client: string;
	amount: number;
	type: "income" | "expense";
	dueDate: string;
	status: "pending" | "overdue";
	payerName?: string;
}

export interface UserSettings {
	userId: string;
	emailNotifications: boolean;
	taskNotifications: boolean;
	projectNotifications: boolean;
	financeNotifications: boolean;
	systemNotifications: boolean;
	darkMode?: boolean;
	notificationSettings?: {
		emailNotifications: boolean;
		taskNotifications: boolean;
		projectNotifications: boolean;
		financeNotifications: boolean;
		systemNotifications: boolean;
		browserNotifications?: boolean;
	};
}

export interface TaskType {
  id: string;
  name: string;
  description?: string;
  isDefault?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
