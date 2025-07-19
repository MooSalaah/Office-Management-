import { mockUsers, rolePermissions } from "./auth";

// دالة لإضافة البيانات الافتراضية
export const initializeDefaultData = () => {
	if (typeof window === "undefined") return;

	console.log("Initializing default data...");

	// إضافة المستخدمين الافتراضيين
	const existingUsers = localStorage.getItem("users");
	if (!existingUsers) {
		console.log("Adding default users...");
		localStorage.setItem("users", JSON.stringify(mockUsers));
	} else {
		console.log("Users already exist in localStorage");
	}

	// إضافة الأدوار والصلاحيات
	const existingJobRoles = localStorage.getItem("jobRoles");
	if (!existingJobRoles) {
		console.log("Adding default job roles...");
		const defaultJobRoles = Object.keys(rolePermissions).map((key) => ({
			id: key,
			...rolePermissions[key as keyof typeof rolePermissions],
		}));
		localStorage.setItem("jobRoles", JSON.stringify(defaultJobRoles));
	} else {
		console.log("Job roles already exist in localStorage");
	}

	// إضافة الصلاحيات للتوافق مع الإصدارات السابقة
	localStorage.setItem("rolePermissions", JSON.stringify(rolePermissions));

	console.log("Default data initialization completed");
};

// دالة لمسح جميع البيانات وإعادة تهيئتها
export const resetToDefaultData = () => {
	if (typeof window === "undefined") return;

	console.log("Resetting to default data...");

	// مسح البيانات الحالية
	localStorage.removeItem("users");
	localStorage.removeItem("jobRoles");
	localStorage.removeItem("rolePermissions");
	localStorage.removeItem("currentUser");

	// إعادة تهيئة البيانات الافتراضية
	initializeDefaultData();

	console.log("Reset to default data completed");
};

// دالة لعرض البيانات الحالية
export const showCurrentData = () => {
	if (typeof window === "undefined") return;

	console.log("=== Current localStorage data ===");
	console.log("Users:", localStorage.getItem("users"));
	console.log("Job Roles:", localStorage.getItem("jobRoles"));
	console.log("Role Permissions:", localStorage.getItem("rolePermissions"));
	console.log("Current User:", localStorage.getItem("currentUser"));
	console.log("=================================");
};
