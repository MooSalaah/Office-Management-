import React, { Suspense, lazy } from "react";

// Code splitting utilities for performance optimization

// Lazy load pages
export const LazyPages = {
	Dashboard: lazy(() => import("@/app/dashboard/page")),
	Projects: lazy(() => import("@/app/projects/page")),
	Clients: lazy(() => import("@/app/clients/page")),
	Tasks: lazy(() => import("@/app/tasks/page")),
	Finance: lazy(() => import("@/app/finance/page")),
	Attendance: lazy(() => import("@/app/attendance/page")),
	Settings: lazy(() => import("@/app/settings/page")),
};

// Lazy load components
export const LazyComponents = {
	// Dashboard components
	DashboardStats: lazy(() => import("@/components/dashboard/DashboardStats")),
	DashboardCharts: lazy(() => import("@/components/dashboard/DashboardCharts")),
	RecentActivities: lazy(
		() => import("@/components/dashboard/RecentActivities")
	),

	// Project components
	ProjectList: lazy(() => import("@/components/projects/ProjectList")),
	ProjectCard: lazy(() => import("@/components/projects/ProjectCard")),
	ProjectForm: lazy(() => import("@/components/projects/ProjectForm")),
	ProjectDetails: lazy(() => import("@/components/projects/ProjectDetails")),

	// Task components
	TaskList: lazy(() => import("@/components/tasks/TaskList")),
	TaskCard: lazy(() => import("@/components/tasks/TaskCard")),
	TaskForm: lazy(() => import("@/components/tasks/TaskForm")),
	TaskDetails: lazy(() => import("@/components/tasks/TaskDetails")),

	// Client components
	ClientList: lazy(() => import("@/components/clients/ClientList")),
	ClientCard: lazy(() => import("@/components/clients/ClientCard")),
	ClientForm: lazy(() => import("@/components/clients/ClientForm")),
	ClientDetails: lazy(() => import("@/components/clients/ClientDetails")),

	// Finance components
	FinanceDashboard: lazy(() => import("@/components/finance/FinanceDashboard")),
	TransactionList: lazy(() => import("@/components/finance/TransactionList")),
	TransactionForm: lazy(() => import("@/components/finance/TransactionForm")),
	FinancialReports: lazy(() => import("@/components/finance/FinancialReports")),

	// Settings components
	SettingsPanel: lazy(() => import("@/components/settings/SettingsPanel")),
	UserManagement: lazy(() => import("@/components/settings/UserManagement")),
	SystemSettings: lazy(() => import("@/components/settings/SystemSettings")),
	NotificationSettings: lazy(
		() => import("@/components/settings/NotificationSettings")
	),
};

// Lazy load utilities
export const LazyUtils = {
	// Chart libraries
	Recharts: lazy(() =>
		import("recharts").then((m) => ({
			default: m.LineChart,
			LineChart: m.LineChart,
			BarChart: m.BarChart,
			PieChart: m.PieChart,
			AreaChart: m.AreaChart,
			Line: m.Line,
			Bar: m.Bar,
			Pie: m.Pie,
			Area: m.Area,
			XAxis: m.XAxis,
			YAxis: m.YAxis,
			CartesianGrid: m.CartesianGrid,
			Tooltip: m.Tooltip,
			Legend: m.Legend,
			ResponsiveContainer: m.ResponsiveContainer,
		}))
	),

	// Date utilities
	DateFns: lazy(() =>
		import("date-fns").then((m) => ({
			format: m.format,
			parseISO: m.parseISO,
			addDays: m.addDays,
			subDays: m.subDays,
			startOfDay: m.startOfDay,
			endOfDay: m.endOfDay,
			isToday: m.isToday,
			isYesterday: m.isYesterday,
			differenceInDays: m.differenceInDays,
			differenceInHours: m.differenceInHours,
		}))
	),

	// Form libraries
	ReactHookForm: lazy(() =>
		import("react-hook-form").then((m) => ({
			useForm: m.useForm,
			useFieldArray: m.useFieldArray,
			useWatch: m.useWatch,
			useController: m.useController,
		}))
	),

	// State management
	Zustand: lazy(() => import("zustand").then((m) => ({ default: m.default }))),

	// Data manipulation
	Lodash: lazy(() =>
		import("lodash").then((m) => ({
			debounce: m.debounce,
			throttle: m.throttle,
			isEmpty: m.isEmpty,
			isEqual: m.isEqual,
			cloneDeep: m.cloneDeep,
			merge: m.merge,
			pick: m.pick,
			omit: m.omit,
			groupBy: m.groupBy,
			sortBy: m.sortBy,
			uniq: m.uniq,
			chunk: m.chunk,
		}))
	),
};

// Loading components
export const LoadingComponents = {
	// Page loading
	PageLoading: () => (
		<div className="flex items-center justify-center min-h-screen">
			<div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
		</div>
	),

	// Component loading
	ComponentLoading: () => (
		<div className="flex items-center justify-center p-4">
			<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
		</div>
	),

	// Skeleton loading
	SkeletonLoading: () => (
		<div className="space-y-4">
			<div className="animate-pulse">
				<div className="h-4 bg-gray-200 rounded w-3/4"></div>
				<div className="space-y-3 mt-4">
					<div className="h-4 bg-gray-200 rounded"></div>
					<div className="h-4 bg-gray-200 rounded w-5/6"></div>
				</div>
			</div>
		</div>
	),

	// Card loading
	CardLoading: () => (
		<div className="border rounded-lg p-4 animate-pulse">
			<div className="flex items-center justify-between mb-2">
				<div className="h-4 bg-gray-200 rounded w-1/2"></div>
				<div className="h-6 bg-gray-200 rounded w-16"></div>
			</div>
			<div className="h-3 bg-gray-200 rounded w-3/4 mb-3"></div>
			<div className="space-y-2">
				<div className="flex items-center justify-between">
					<div className="h-3 bg-gray-200 rounded w-16"></div>
					<div className="h-3 bg-gray-200 rounded w-8"></div>
				</div>
				<div className="h-2 bg-gray-200 rounded w-full"></div>
			</div>
		</div>
	),

	// Table loading
	TableLoading: () => (
		<div className="animate-pulse">
			<div className="border rounded-lg">
				<div className="bg-gray-50 px-6 py-3 border-b">
					<div className="h-4 bg-gray-200 rounded w-1/4"></div>
				</div>
				{Array.from({ length: 5 }).map((_, i) => (
					<div key={i} className="px-6 py-4 border-b">
						<div className="flex items-center justify-between">
							<div className="h-4 bg-gray-200 rounded w-1/3"></div>
							<div className="h-4 bg-gray-200 rounded w-1/6"></div>
							<div className="h-4 bg-gray-200 rounded w-1/6"></div>
							<div className="h-4 bg-gray-200 rounded w-1/6"></div>
						</div>
					</div>
				))}
			</div>
		</div>
	),

	// Chart loading
	ChartLoading: () => (
		<div className="border rounded-lg p-4 animate-pulse">
			<div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
			<div className="h-64 bg-gray-200 rounded"></div>
		</div>
	),

	// Form loading
	FormLoading: () => (
		<div className="space-y-4 animate-pulse">
			<div>
				<div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
				<div className="h-10 bg-gray-200 rounded"></div>
			</div>
			<div>
				<div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
				<div className="h-10 bg-gray-200 rounded"></div>
			</div>
			<div>
				<div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
				<div className="h-20 bg-gray-200 rounded"></div>
			</div>
			<div className="h-10 bg-gray-200 rounded w-24"></div>
		</div>
	),
};

// Route-based code splitting
export const RouteBasedSplitting = {
	// Dashboard routes
	dashboard: {
		component: LazyPages.Dashboard,
		loading: LoadingComponents.PageLoading,
		preload: () => import("@/app/dashboard/page"),
	},

	// Project routes
	projects: {
		component: LazyPages.Projects,
		loading: LoadingComponents.PageLoading,
		preload: () => import("@/app/projects/page"),
	},

	// Client routes
	clients: {
		component: LazyPages.Clients,
		loading: LoadingComponents.PageLoading,
		preload: () => import("@/app/clients/page"),
	},

	// Task routes
	tasks: {
		component: LazyPages.Tasks,
		loading: LoadingComponents.PageLoading,
		preload: () => import("@/app/tasks/page"),
	},

	// Finance routes
	finance: {
		component: LazyPages.Finance,
		loading: LoadingComponents.PageLoading,
		preload: () => import("@/app/finance/page"),
	},

	// Attendance routes
	attendance: {
		component: LazyPages.Attendance,
		loading: LoadingComponents.PageLoading,
		preload: () => import("@/app/attendance/page"),
	},

	// Settings routes
	settings: {
		component: LazyPages.Settings,
		loading: LoadingComponents.PageLoading,
		preload: () => import("@/app/settings/page"),
	},
};

// Feature-based code splitting
export const FeatureBasedSplitting = {
	// Dashboard features
	dashboard: {
		stats: LazyComponents.DashboardStats,
		charts: LazyComponents.DashboardCharts,
		activities: LazyComponents.RecentActivities,
	},

	// Project features
	projects: {
		list: LazyComponents.ProjectList,
		card: LazyComponents.ProjectCard,
		form: LazyComponents.ProjectForm,
		details: LazyComponents.ProjectDetails,
	},

	// Task features
	tasks: {
		list: LazyComponents.TaskList,
		card: LazyComponents.TaskCard,
		form: LazyComponents.TaskForm,
		details: LazyComponents.TaskDetails,
	},

	// Client features
	clients: {
		list: LazyComponents.ClientList,
		card: LazyComponents.ClientCard,
		form: LazyComponents.ClientForm,
		details: LazyComponents.ClientDetails,
	},

	// Finance features
	finance: {
		dashboard: LazyComponents.FinanceDashboard,
		transactions: LazyComponents.TransactionList,
		form: LazyComponents.TransactionForm,
		reports: LazyComponents.FinancialReports,
	},

	// Settings features
	settings: {
		panel: LazyComponents.SettingsPanel,
		users: LazyComponents.UserManagement,
		system: LazyComponents.SystemSettings,
		notifications: LazyComponents.NotificationSettings,
	},
};

// Utility-based code splitting
export const UtilityBasedSplitting = {
	// Charts
	charts: LazyUtils.Recharts,

	// Date utilities
	dates: LazyUtils.DateFns,

	// Forms
	forms: LazyUtils.ReactHookForm,

	// State management
	state: LazyUtils.Zustand,

	// Data manipulation
	data: LazyUtils.Lodash,
};

// Code splitting wrapper component
export function CodeSplitWrapper({
	component: Component,
	loading: LoadingComponent = LoadingComponents.ComponentLoading,
	fallback,
	...props
}: {
	component: React.ComponentType<any>;
	loading?: React.ComponentType;
	fallback?: React.ReactNode;
	[key: string]: any;
}) {
	return (
		<Suspense fallback={fallback || <LoadingComponent />}>
			<Component {...props} />
		</Suspense>
	);
}

// Preload utilities
export const PreloadUtils = {
	// Preload route
	preloadRoute: (route: keyof typeof RouteBasedSplitting) => {
		const routeConfig = RouteBasedSplitting[route];
		if (routeConfig?.preload) {
			routeConfig.preload();
		}
	},

	// Preload component
	preloadComponent: (component: React.ComponentType) => {
		// Trigger component load
		component({});
	},

	// Preload feature
	preloadFeature: (feature: string, subFeature?: string) => {
		const featureConfig =
			FeatureBasedSplitting[feature as keyof typeof FeatureBasedSplitting];
		if (featureConfig) {
			if (
				subFeature &&
				featureConfig[subFeature as keyof typeof featureConfig]
			) {
				featureConfig[subFeature as keyof typeof featureConfig]({});
			} else {
				// Preload all components in feature
				Object.values(featureConfig).forEach((component) => {
					component({});
				});
			}
		}
	},

	// Preload utility
	preloadUtility: (utility: keyof typeof UtilityBasedSplitting) => {
		const utilityComponent = UtilityBasedSplitting[utility];
		if (utilityComponent) {
			utilityComponent({});
		}
	},
};

// Dynamic imports with error boundaries
export function createErrorBoundary(
	Component: React.ComponentType,
	fallback?: React.ComponentType
) {
	return class ErrorBoundary extends React.Component<
		{ children: React.ReactNode },
		{ hasError: boolean }
	> {
		constructor(props: { children: React.ReactNode }) {
			super(props);
			this.state = { hasError: false };
		}

		static getDerivedStateFromError() {
			return { hasError: true };
		}

		componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
			console.error("Error loading component:", error, errorInfo);
		}

		render() {
			if (this.state.hasError) {
				return fallback ? <fallback /> : <div>Error loading component</div>;
			}

			return <Component {...this.props} />;
		}
	};
}
