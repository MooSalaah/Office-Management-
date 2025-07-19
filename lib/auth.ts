"use client";

import type { User } from "./types";

// Mock authentication - في التطبيق الحقيقي سيكون مع JWT أو session
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
		id: "2",
		name: "أحمد محمد",
		email: "engineer@newcorner.sa",
		password: "engineer123",
		role: "engineer",
		phone: "+966502345678",
		isActive: true,
		createdAt: "2024-01-01",
		monthlySalary: 3000,
		workingHours: {
			morningStart: "08:00",
			morningEnd: "12:00",
			eveningStart: "16:00",
			eveningEnd: "21:00",
		},
	},
	{
		id: "3",
		name: "فاطمة علي",
		email: "accountant@newcorner.sa",
		password: "accountant123",
		role: "accountant",
		phone: "+966503456789",
		isActive: true,
		createdAt: "2024-01-01",
		monthlySalary: 2500,
		workingHours: {
			morningStart: "08:00",
			morningEnd: "12:00",
			eveningStart: "16:00",
			eveningEnd: "21:00",
		},
	},
	{
		id: "4",
		name: "خالد أحمد",
		email: "hr@newcorner.sa",
		password: "hr123",
		role: "hr",
		phone: "+966504567890",
		isActive: true,
		createdAt: "2024-01-01",
		monthlySalary: 2000,
		workingHours: {
			morningStart: "08:00",
			morningEnd: "12:00",
			eveningStart: "16:00",
			eveningEnd: "21:00",
		},
	},
];

// Dynamic role-based permissions system
export const rolePermissions = {
	admin: {
		name: "مدير عام",
		description: "إدارة شاملة للمكتب",
		permissions: ["*"], // All permissions
		modules: [
			"dashboard",
			"projects",
			"tasks",
			"finance",
			"users",
			"attendance",
			"clients",
			"settings",
		],
	},
	engineer: {
		name: "مهندس",
		description: "تصميم وإشراف هندسي",
		permissions: [
			"view_dashboard",
			"view_projects",
			"edit_projects",
			"create_projects",
			"view_tasks",
			"edit_tasks",
			"create_tasks",
			"view_attendance",
			"checkin_attendance",
			"checkout_attendance",
			"view_clients",
			"view_finance",
			"view_settings",
		],
		modules: [
			"dashboard",
			"projects",
			"tasks",
			"attendance",
			"clients",
			"finance",
			"settings",
		],
	},
	accountant: {
		name: "محاسب",
		description: "إدارة مالية ومحاسبية",
		permissions: [
			"view_dashboard",
			"view_finance",
			"edit_finance",
			"create_finance",
			"view_projects",
			"view_clients",
			"view_attendance",
			"checkin_attendance",
			"checkout_attendance",
			"view_settings",
		],
		modules: [
			"dashboard",
			"finance",
			"projects",
			"clients",
			"attendance",
			"settings",
		],
	},
	hr: {
		name: "موارد بشرية",
		description: "إدارة الموظفين والحضور",
		permissions: [
			"view_dashboard",
			"view_users",
			"edit_users",
			"create_users",
			"view_attendance",
			"edit_attendance",
			"view_clients",
			"edit_clients",
			"create_clients",
			"checkin_attendance",
			"checkout_attendance",
			"view_settings",
			"edit_settings",
		],
		modules: ["dashboard", "users", "attendance", "clients", "settings"],
	},
};

// Initialize default roles in localStorage if not exists
export const initializeDefaultRoles = () => {
	if (typeof window === "undefined") return;

	const existingJobRoles = localStorage.getItem("jobRoles");
	if (!existingJobRoles) {
		// Convert rolePermissions to jobRoles format
		const defaultJobRoles = Object.keys(rolePermissions).map((key) => ({
			id: key,
			...rolePermissions[key as keyof typeof rolePermissions],
		}));
		localStorage.setItem("jobRoles", JSON.stringify(defaultJobRoles));
	}

	// Also save rolePermissions for backward compatibility
	localStorage.setItem("rolePermissions", JSON.stringify(rolePermissions));

	// Initialize default users if not exists
	const existingUsers = localStorage.getItem("users");
	if (!existingUsers) {
		localStorage.setItem("users", JSON.stringify(mockUsers));
	}
};

// Update current user permissions based on their role
export const updateCurrentUserPermissions = (): void => {
	if (typeof window === "undefined") return;

	const userData = localStorage.getItem("currentUser");
	if (!userData) return;

	const user = JSON.parse(userData);

	// Get role permissions
	const jobRoles = localStorage.getItem("jobRoles");
	if (jobRoles) {
		const roles = JSON.parse(jobRoles);
		const userRole = roles.find((role: any) => role.id === user.role);
		if (userRole) {
			// Update user permissions based on current role
			const updatedUser = { ...user, permissions: userRole.permissions };
			localStorage.setItem("currentUser", JSON.stringify(updatedUser));
		}
	}
};

// Update user permissions based on their role
export const updateUserPermissionsByRole = (user: User): User => {
	const jobRoles = localStorage.getItem("jobRoles");
	if (jobRoles) {
		const roles = JSON.parse(jobRoles);
		const userRole = roles.find((role: any) => role.id === user.role);
		if (userRole) {
			return { ...user, permissions: userRole.permissions };
		}
	}
	return user;
};

export const login = (email: string, password: string): User | null => {
	console.log("Attempting login with:", { email, password });

	// Initialize default roles first
	initializeDefaultRoles();

	// First check localStorage for users (dynamic users)
	const savedUsers = localStorage.getItem("users");
	console.log("Saved users from localStorage:", savedUsers);

	if (savedUsers) {
		const users = JSON.parse(savedUsers);
		console.log("Parsed users:", users);

		const user = users.find(
			(u: any) => u.email === email && u.password === password && u.isActive
		);
		console.log("Found user:", user);

		if (user) {
			// Update user permissions based on current role
			const updatedUser = updateUserPermissionsByRole(user);
			console.log("Updated user with permissions:", updatedUser);
			localStorage.setItem("currentUser", JSON.stringify(updatedUser));
			return updatedUser;
		}
	}

	// Fallback to mock users
	console.log("Checking mock users...");
	const user = mockUsers.find(
		(u) => u.email === email && u.password === password && u.isActive
	);
	console.log("Found user in mock users:", user);

	if (user) {
		// Update user permissions based on current role
		const updatedUser = updateUserPermissionsByRole(user);
		console.log("Updated user with permissions:", updatedUser);
		localStorage.setItem("currentUser", JSON.stringify(updatedUser));
		return updatedUser;
	}

	console.log("No user found, login failed");
	return null;
};

export const logout = () => {
	// Clear only user-specific data from localStorage
	localStorage.removeItem("currentUser");
	localStorage.removeItem("attendanceRecords");

	// Keep important system data like roles, permissions, users, etc.
	// localStorage.removeItem("projects"); // Keep projects
	// localStorage.removeItem("tasks"); // Keep tasks
	// localStorage.removeItem("finance"); // Keep finance
	// localStorage.removeItem("clients"); // Keep clients
	// localStorage.removeItem("notifications"); // Keep notifications
	// localStorage.removeItem("rolePermissions"); // Keep role permissions
	// localStorage.removeItem("jobRoles"); // Keep job roles
	// localStorage.removeItem("users"); // Keep users

	// Clear any other session data
	sessionStorage.clear();

	// Force redirect to home page
	if (typeof window !== "undefined") {
		window.location.href = "/";
	}
};

export const updateUserPermissions = (userId: string): void => {
	const userData = localStorage.getItem("currentUser");
	if (!userData) return;

	const user = JSON.parse(userData);
	if (user.id !== userId) return;

	// Update user permissions based on current role permissions
	const jobRoles = localStorage.getItem("jobRoles");
	if (jobRoles) {
		const roles = JSON.parse(jobRoles);
		const userRole = roles.find((role: any) => role.id === user.role);
		if (userRole) {
			// Update user permissions based on current role
			const updatedUser = { ...user, permissions: userRole.permissions };
			localStorage.setItem("currentUser", JSON.stringify(updatedUser));
		}
	}
};

export const getCurrentUser = (): User | null => {
	if (typeof window === "undefined") return null;

	// Update current user permissions first
	updateCurrentUserPermissions();

	const userData = localStorage.getItem("currentUser");
	if (!userData) return null;

	const user = JSON.parse(userData);

	// Check if there's updated user data in localStorage
	const savedUsers = localStorage.getItem("users");
	if (savedUsers) {
		const users = JSON.parse(savedUsers);
		const updatedUser = users.find((u: any) => u.id === user.id);
		if (updatedUser) {
			// Update user with latest permissions and data
			const finalUser = { ...user, ...updatedUser };

			// Update user permissions based on current role permissions
			const jobRoles = localStorage.getItem("jobRoles");
			if (jobRoles) {
				const roles = JSON.parse(jobRoles);
				const userRole = roles.find((role: any) => role.id === finalUser.role);
				if (userRole) {
					// Update user permissions based on current role
					finalUser.permissions = userRole.permissions;
					localStorage.setItem("currentUser", JSON.stringify(finalUser));
					return finalUser;
				}
			}

			localStorage.setItem("currentUser", JSON.stringify(finalUser));
			return finalUser;
		}
	}

	// Update user permissions based on current role permissions
	const jobRoles = localStorage.getItem("jobRoles");
	if (jobRoles) {
		const roles = JSON.parse(jobRoles);
		const userRole = roles.find((role: any) => role.id === user.role);
		if (userRole) {
			// Update user permissions based on current role
			const updatedUser = { ...user, permissions: userRole.permissions };
			localStorage.setItem("currentUser", JSON.stringify(updatedUser));
			return updatedUser;
		}
	}

	// Also check if role permissions have been updated
	const savedRolePermissions = localStorage.getItem("rolePermissions");
	if (savedRolePermissions) {
		const updatedRolePermissions = JSON.parse(savedRolePermissions);
		Object.assign(rolePermissions, updatedRolePermissions);
	}

	return user;
};

export const hasPermission = (
	userRole: string,
	action: string,
	module: string
): boolean => {
	// Admin has all permissions
	if (userRole === "admin") return true;

	// First check custom job roles from localStorage
	const jobRoles = localStorage.getItem("jobRoles");
	if (jobRoles) {
		const roles = JSON.parse(jobRoles);
		const customRole = roles.find((role: any) => role.id === userRole);
		if (customRole) {
			// Check if role has all permissions
			if (customRole.permissions.includes("*")) return true;

			// Check specific permission - handle multiple formats
			const permission1 = `${action}_${module}`;
			const permission2 = `${action} ${module}`;
			const permission3 = `${action}${module}`;

			return (
				customRole.permissions.includes(permission1) ||
				customRole.permissions.includes(permission2) ||
				customRole.permissions.includes(permission3) ||
				customRole.permissions.includes(`${action}_${module}`) ||
				customRole.permissions.includes(`${action} ${module}`) ||
				customRole.permissions.includes(`${action}${module}`)
			);
		}
	}

	// Fallback to default rolePermissions
	const savedRolePermissions = localStorage.getItem("rolePermissions");
	if (savedRolePermissions) {
		const updatedRolePermissions = JSON.parse(savedRolePermissions);
		Object.assign(rolePermissions, updatedRolePermissions);
	}

	const role = rolePermissions[userRole as keyof typeof rolePermissions];
	if (!role) return false;

	// Admin has all permissions
	if (role.permissions.includes("*")) return true;

	// Check specific permission - handle multiple formats
	const permission1 = `${action}_${module}`;
	const permission2 = `${action} ${module}`;
	const permission3 = `${action}${module}`;

	return (
		role.permissions.includes(permission1) ||
		role.permissions.includes(permission2) ||
		role.permissions.includes(permission3)
	);
};

export const getUserModules = (userRole: string): string[] => {
	// First check custom job roles from localStorage
	const jobRoles = localStorage.getItem("jobRoles");
	if (jobRoles) {
		const roles = JSON.parse(jobRoles);
		const customRole = roles.find((role: any) => role.id === userRole);
		if (customRole && customRole.modules) {
			return customRole.modules;
		}
	}

	// Fallback to default rolePermissions
	const savedRolePermissions = localStorage.getItem("rolePermissions");
	if (savedRolePermissions) {
		const updatedRolePermissions = JSON.parse(savedRolePermissions);
		Object.assign(rolePermissions, updatedRolePermissions);
	}

	const role = rolePermissions[userRole as keyof typeof rolePermissions];
	return role ? role.modules : [];
};

export const canAccessModule = (userRole: string, module: string): boolean => {
	// Admin has access to all modules
	if (userRole === "admin") return true;

	// First check custom job roles from localStorage
	const jobRoles = localStorage.getItem("jobRoles");
	if (jobRoles) {
		const roles = JSON.parse(jobRoles);
		const customRole = roles.find((role: any) => role.id === userRole);
		if (customRole && customRole.modules) {
			return customRole.modules.includes(module);
		}
	}

	// Fallback to default rolePermissions
	const savedRolePermissions = localStorage.getItem("rolePermissions");
	if (savedRolePermissions) {
		const updatedRolePermissions = JSON.parse(savedRolePermissions);
		Object.assign(rolePermissions, updatedRolePermissions);
	}

	const modules = getUserModules(userRole);
	return modules.includes(module);
};

export const getRolePermissions = (role: string) => {
	// First check custom job roles from localStorage
	const jobRoles = localStorage.getItem("jobRoles");
	if (jobRoles) {
		const roles = JSON.parse(jobRoles);
		const customRole = roles.find((r: any) => r.id === role);
		if (customRole) {
			return customRole;
		}
	}

	// Fallback to default rolePermissions
	const savedRolePermissions = localStorage.getItem("rolePermissions");
	if (savedRolePermissions) {
		const updatedRolePermissions = JSON.parse(savedRolePermissions);
		Object.assign(rolePermissions, updatedRolePermissions);
	}

	return rolePermissions[role as keyof typeof rolePermissions] || null;
};

export const getAllRoles = () => {
	// First check custom job roles from localStorage
	const jobRoles = localStorage.getItem("jobRoles");
	if (jobRoles) {
		const roles = JSON.parse(jobRoles);
		return roles;
	}

	// Fallback to default rolePermissions
	const savedRolePermissions = localStorage.getItem("rolePermissions");
	if (savedRolePermissions) {
		const updatedRolePermissions = JSON.parse(savedRolePermissions);
		Object.assign(rolePermissions, updatedRolePermissions);
	}

	return Object.keys(rolePermissions).map((key) => ({
		id: key,
		...rolePermissions[key as keyof typeof rolePermissions],
	}));
};
