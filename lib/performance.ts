import { useMemo, useCallback } from "react";
import type { Project, Task, Transaction, Client, User } from "./types";

// تحسين أداء الفلترة والبحث
export const useFilteredData = <T extends { id: string }>(
	data: T[],
	searchTerm: string,
	filterKey: keyof T
) => {
	return useMemo(() => {
		if (!searchTerm.trim()) return data;

		const searchLower = searchTerm.toLowerCase();
		return data.filter((item) => {
			const value = item[filterKey];
			return (
				typeof value === "string" && value.toLowerCase().includes(searchLower)
			);
		});
	}, [data, searchTerm, filterKey]);
};

// تحسين أداء حساب الإحصائيات
export const useStatistics = (
	projects: Project[],
	tasks: Task[],
	transactions: Transaction[]
) => {
	return useMemo(() => {
		const activeProjects = projects.filter((p) => p.status === "in-progress");
		const completedProjects = projects.filter((p) => p.status === "completed");
		const pendingTasks = tasks.filter((t) => t.status === "todo");
		const completedTasks = tasks.filter((t) => t.status === "completed");

		const currentMonth = new Date().getMonth();
		const currentYear = new Date().getFullYear();

		const monthlyIncome = transactions
			.filter((t) => {
				const date = new Date(t.date);
				return (
					t.type === "income" &&
					date.getMonth() === currentMonth &&
					date.getFullYear() === currentYear
				);
			})
			.reduce((sum, t) => sum + t.amount, 0);

		const monthlyExpenses = transactions
			.filter((t) => {
				const date = new Date(t.date);
				return (
					t.type === "expense" &&
					date.getMonth() === currentMonth &&
					date.getFullYear() === currentYear
				);
			})
			.reduce((sum, t) => sum + t.amount, 0);

		return {
			activeProjects: activeProjects.length,
			completedProjects: completedProjects.length,
			pendingTasks: pendingTasks.length,
			completedTasks: completedTasks.length,
			monthlyIncome,
			monthlyExpenses,
			monthlyProfit: monthlyIncome - monthlyExpenses,
			totalProjects: projects.length,
			totalTasks: tasks.length,
			totalTransactions: transactions.length,
		};
	}, [projects, tasks, transactions]);
};

// تحسين أداء البحث في المستخدمين
export const useUserSearch = (users: User[], searchTerm: string) => {
	return useMemo(() => {
		if (!searchTerm.trim()) return users;

		const searchLower = searchTerm.toLowerCase();
		return users.filter(
			(user) =>
				user.name.toLowerCase().includes(searchLower) ||
				user.email.toLowerCase().includes(searchLower) ||
				user.role.toLowerCase().includes(searchLower)
		);
	}, [users, searchTerm]);
};

// تحسين أداء البحث في المشاريع
export const useProjectSearch = (projects: Project[], searchTerm: string) => {
	return useMemo(() => {
		if (!searchTerm.trim()) return projects;

		const searchLower = searchTerm.toLowerCase();
		return projects.filter(
			(project) =>
				project.name.toLowerCase().includes(searchLower) ||
				project.client.toLowerCase().includes(searchLower) ||
				project.type.toLowerCase().includes(searchLower)
		);
	}, [projects, searchTerm]);
};

// تحسين أداء البحث في المهام
export const useTaskSearch = (tasks: Task[], searchTerm: string) => {
	return useMemo(() => {
		if (!searchTerm.trim()) return tasks;

		const searchLower = searchTerm.toLowerCase();
		return tasks.filter(
			(task) =>
				task.title.toLowerCase().includes(searchLower) ||
				task.description.toLowerCase().includes(searchLower) ||
				task.assigneeName.toLowerCase().includes(searchLower) ||
				task.projectName.toLowerCase().includes(searchLower)
		);
	}, [tasks, searchTerm]);
};

// تحسين أداء البحث في المعاملات المالية
export const useTransactionSearch = (
	transactions: Transaction[],
	searchTerm: string
) => {
	return useMemo(() => {
		if (!searchTerm.trim()) return transactions;

		const searchLower = searchTerm.toLowerCase();
		return transactions.filter(
			(transaction) =>
				transaction.description.toLowerCase().includes(searchLower) ||
				transaction.clientName?.toLowerCase().includes(searchLower) ||
				transaction.transactionType.toLowerCase().includes(searchLower)
		);
	}, [transactions, searchTerm]);
};

// تحسين أداء الفلترة حسب الحالة
export const useStatusFilter = <T extends { status: string }>(
	data: T[],
	statusFilter: string
) => {
	return useMemo(() => {
		if (statusFilter === "all") return data;
		return data.filter((item) => item.status === statusFilter);
	}, [data, statusFilter]);
};

// تحسين أداء الفلترة حسب النوع
export const useTypeFilter = <T extends { type: string }>(
	data: T[],
	typeFilter: string
) => {
	return useMemo(() => {
		if (typeFilter === "all") return data;
		return data.filter((item) => item.type === typeFilter);
	}, [data, typeFilter]);
};

// تحسين أداء الفلترة حسب الأولوية
export const usePriorityFilter = <T extends { priority: string }>(
	data: T[],
	priorityFilter: string
) => {
	return useMemo(() => {
		if (priorityFilter === "all") return data;
		return data.filter((item) => item.priority === priorityFilter);
	}, [data, priorityFilter]);
};

// تحسين أداء الفلترة حسب التاريخ
export const useDateFilter = <T extends { date: string }>(
	data: T[],
	startDate: string,
	endDate: string
) => {
	return useMemo(() => {
		if (!startDate && !endDate) return data;

		return data.filter((item) => {
			const itemDate = new Date(item.date);
			const start = startDate ? new Date(startDate) : null;
			const end = endDate ? new Date(endDate) : null;

			if (start && end) {
				return itemDate >= start && itemDate <= end;
			} else if (start) {
				return itemDate >= start;
			} else if (end) {
				return itemDate <= end;
			}

			return true;
		});
	}, [data, startDate, endDate]);
};

// تحسين أداء الفرز
export const useSortedData = <T>(
	data: T[],
	sortBy: keyof T | null,
	sortOrder: "asc" | "desc"
) => {
	return useMemo(() => {
		if (!sortBy) return data;

		return [...data].sort((a, b) => {
			const aValue = a[sortBy];
			const bValue = b[sortBy];

			if (typeof aValue === "string" && typeof bValue === "string") {
				return sortOrder === "asc"
					? aValue.localeCompare(bValue)
					: bValue.localeCompare(aValue);
			}

			if (typeof aValue === "number" && typeof bValue === "number") {
				return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
			}

			return 0;
		});
	}, [data, sortBy, sortOrder]);
};

// تحسين أداء التجميع
export const useGroupedData = <T>(data: T[], groupBy: keyof T) => {
	return useMemo(() => {
		const groups: Record<string, T[]> = {};

		data.forEach((item) => {
			const key = String(item[groupBy]);
			if (!groups[key]) {
				groups[key] = [];
			}
			groups[key].push(item);
		});

		return groups;
	}, [data, groupBy]);
};

// تحسين أداء التخزين المؤقت
export const useCachedValue = <T>(value: T, dependencies: any[]) => {
	return useMemo(() => value, dependencies);
};

// تحسين أداء الدوال
export const useCachedCallback = <T extends (...args: any[]) => any>(
	callback: T,
	dependencies: any[]
) => {
	return useCallback(callback, dependencies);
};
