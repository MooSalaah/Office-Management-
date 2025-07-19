// Tree shaking utilities for performance optimization

// Import only what you need from large libraries
export const optimizedImports = {
	// Lucide React - import only used icons
	icons: {
		// Dashboard icons
		dashboard: () =>
			import("lucide-react").then((m) => ({ default: m.LayoutDashboard })),
		projects: () =>
			import("lucide-react").then((m) => ({ default: m.FolderOpen })),
		clients: () => import("lucide-react").then((m) => ({ default: m.Users })),
		tasks: () =>
			import("lucide-react").then((m) => ({ default: m.CheckSquare })),
		finance: () =>
			import("lucide-react").then((m) => ({ default: m.DollarSign })),
		attendance: () =>
			import("lucide-react").then((m) => ({ default: m.Clock })),
		settings: () =>
			import("lucide-react").then((m) => ({ default: m.Settings })),

		// Action icons
		plus: () => import("lucide-react").then((m) => ({ default: m.Plus })),
		edit: () => import("lucide-react").then((m) => ({ default: m.Edit2 })),
		delete: () => import("lucide-react").then((m) => ({ default: m.Trash2 })),
		eye: () => import("lucide-react").then((m) => ({ default: m.Eye })),
		search: () => import("lucide-react").then((m) => ({ default: m.Search })),
		filter: () => import("lucide-react").then((m) => ({ default: m.Filter })),
		download: () =>
			import("lucide-react").then((m) => ({ default: m.Download })),

		// Status icons
		check: () =>
			import("lucide-react").then((m) => ({ default: m.CheckCircle })),
		alert: () =>
			import("lucide-react").then((m) => ({ default: m.AlertTriangle })),
		warning: () =>
			import("lucide-react").then((m) => ({ default: m.AlertCircle })),
		info: () => import("lucide-react").then((m) => ({ default: m.Info })),

		// Navigation icons
		arrowLeft: () =>
			import("lucide-react").then((m) => ({ default: m.ArrowLeft })),
		arrowRight: () =>
			import("lucide-react").then((m) => ({ default: m.ArrowRight })),
		chevronDown: () =>
			import("lucide-react").then((m) => ({ default: m.ChevronDown })),
		chevronUp: () =>
			import("lucide-react").then((m) => ({ default: m.ChevronUp })),

		// UI icons
		calendar: () =>
			import("lucide-react").then((m) => ({ default: m.Calendar })),
		clock: () => import("lucide-react").then((m) => ({ default: m.Clock })),
		user: () => import("lucide-react").then((m) => ({ default: m.User })),
		building: () =>
			import("lucide-react").then((m) => ({ default: m.Building2 })),
		bell: () => import("lucide-react").then((m) => ({ default: m.Bell })),
		logout: () => import("lucide-react").then((m) => ({ default: m.LogOut })),
		menu: () => import("lucide-react").then((m) => ({ default: m.Menu })),
		x: () => import("lucide-react").then((m) => ({ default: m.X })),

		// Chart icons
		trendingUp: () =>
			import("lucide-react").then((m) => ({ default: m.TrendingUp })),
		trendingDown: () =>
			import("lucide-react").then((m) => ({ default: m.TrendingDown })),
		barChart: () =>
			import("lucide-react").then((m) => ({ default: m.BarChart3 })),
		pieChart: () =>
			import("lucide-react").then((m) => ({ default: m.PieChart })),

		// Form icons
		save: () => import("lucide-react").then((m) => ({ default: m.Save })),
		upload: () => import("lucide-react").then((m) => ({ default: m.Upload })),
		download: () =>
			import("lucide-react").then((m) => ({ default: m.Download })),
		refresh: () =>
			import("lucide-react").then((m) => ({ default: m.RefreshCw })),

		// Theme icons
		sun: () => import("lucide-react").then((m) => ({ default: m.Sun })),
		moon: () => import("lucide-react").then((m) => ({ default: m.Moon })),
		palette: () => import("lucide-react").then((m) => ({ default: m.Palette })),

		// Utility icons
		copy: () => import("lucide-react").then((m) => ({ default: m.Copy })),
		paste: () => import("lucide-react").then((m) => ({ default: m.Clipboard })),
		link: () => import("lucide-react").then((m) => ({ default: m.Link })),
		externalLink: () =>
			import("lucide-react").then((m) => ({ default: m.ExternalLink })),
		mail: () => import("lucide-react").then((m) => ({ default: m.Mail })),
		phone: () => import("lucide-react").then((m) => ({ default: m.Phone })),
		mapPin: () => import("lucide-react").then((m) => ({ default: m.MapPin })),
		globe: () => import("lucide-react").then((m) => ({ default: m.Globe })),
	},

	// Radix UI - import only used components
	radix: {
		dialog: () =>
			import("@radix-ui/react-dialog").then((m) => ({
				Dialog: m.Dialog,
				DialogTrigger: m.DialogTrigger,
				DialogContent: m.DialogContent,
				DialogHeader: m.DialogHeader,
				DialogTitle: m.DialogTitle,
				DialogDescription: m.DialogDescription,
			})),
		dropdown: () =>
			import("@radix-ui/react-dropdown-menu").then((m) => ({
				DropdownMenu: m.DropdownMenu,
				DropdownMenuTrigger: m.DropdownMenuTrigger,
				DropdownMenuContent: m.DropdownMenuContent,
				DropdownMenuItem: m.DropdownMenuItem,
				DropdownMenuLabel: m.DropdownMenuLabel,
				DropdownMenuSeparator: m.DropdownMenuSeparator,
			})),
		select: () =>
			import("@radix-ui/react-select").then((m) => ({
				Select: m.Select,
				SelectTrigger: m.SelectTrigger,
				SelectContent: m.SelectContent,
				SelectItem: m.SelectItem,
				SelectValue: m.SelectValue,
			})),
		tabs: () =>
			import("@radix-ui/react-tabs").then((m) => ({
				Tabs: m.Tabs,
				TabsList: m.TabsList,
				TabsTrigger: m.TabsTrigger,
				TabsContent: m.TabsContent,
			})),
		accordion: () =>
			import("@radix-ui/react-accordion").then((m) => ({
				Accordion: m.Accordion,
				AccordionItem: m.AccordionItem,
				AccordionTrigger: m.AccordionTrigger,
				AccordionContent: m.AccordionContent,
			})),
		tooltip: () =>
			import("@radix-ui/react-tooltip").then((m) => ({
				Tooltip: m.Tooltip,
				TooltipTrigger: m.TooltipTrigger,
				TooltipContent: m.TooltipContent,
				TooltipProvider: m.TooltipProvider,
			})),
		popover: () =>
			import("@radix-ui/react-popover").then((m) => ({
				Popover: m.Popover,
				PopoverTrigger: m.PopoverTrigger,
				PopoverContent: m.PopoverContent,
			})),
		alertDialog: () =>
			import("@radix-ui/react-alert-dialog").then((m) => ({
				AlertDialog: m.AlertDialog,
				AlertDialogTrigger: m.AlertDialogTrigger,
				AlertDialogContent: m.AlertDialogContent,
				AlertDialogHeader: m.AlertDialogHeader,
				AlertDialogTitle: m.AlertDialogTitle,
				AlertDialogDescription: m.AlertDialogDescription,
				AlertDialogFooter: m.AlertDialogFooter,
				AlertDialogCancel: m.AlertDialogCancel,
				AlertDialogAction: m.AlertDialogAction,
			})),
		switch: () =>
			import("@radix-ui/react-switch").then((m) => ({
				Switch: m.Switch,
				SwitchThumb: m.SwitchThumb,
				SwitchRoot: m.SwitchRoot,
			})),
		checkbox: () =>
			import("@radix-ui/react-checkbox").then((m) => ({
				Checkbox: m.Checkbox,
				CheckboxIndicator: m.CheckboxIndicator,
			})),
		radioGroup: () =>
			import("@radix-ui/react-radio-group").then((m) => ({
				RadioGroup: m.RadioGroup,
				RadioGroupItem: m.RadioGroupItem,
				RadioGroupIndicator: m.RadioGroupIndicator,
			})),
		slider: () =>
			import("@radix-ui/react-slider").then((m) => ({
				Slider: m.Slider,
				SliderTrack: m.SliderTrack,
				SliderRange: m.SliderRange,
				SliderThumb: m.SliderThumb,
			})),
		progress: () =>
			import("@radix-ui/react-progress").then((m) => ({
				Progress: m.Progress,
				ProgressIndicator: m.ProgressIndicator,
			})),
		scrollArea: () =>
			import("@radix-ui/react-scroll-area").then((m) => ({
				ScrollArea: m.ScrollArea,
				ScrollAreaViewport: m.ScrollAreaViewport,
				ScrollAreaScrollbar: m.ScrollAreaScrollbar,
				ScrollAreaThumb: m.ScrollAreaThumb,
				ScrollAreaCorner: m.ScrollAreaCorner,
			})),
		separator: () =>
			import("@radix-ui/react-separator").then((m) => ({
				Separator: m.Separator,
			})),
		avatar: () =>
			import("@radix-ui/react-avatar").then((m) => ({
				Avatar: m.Avatar,
				AvatarImage: m.AvatarImage,
				AvatarFallback: m.AvatarFallback,
			})),
		badge: () =>
			import("@radix-ui/react-badge").then((m) => ({
				Badge: m.Badge,
			})),
		label: () =>
			import("@radix-ui/react-label").then((m) => ({
				Label: m.Label,
			})),
		input: () =>
			import("@radix-ui/react-slot").then((m) => ({
				Slot: m.Slot,
			})),
	},

	// React Hook Form - import only used hooks
	reactHookForm: () =>
		import("react-hook-form").then((m) => ({
			useForm: m.useForm,
			useFieldArray: m.useFieldArray,
			useWatch: m.useWatch,
			useController: m.useController,
		})),

	// React Query - import only used hooks
	reactQuery: () =>
		import("@tanstack/react-query").then((m) => ({
			useQuery: m.useQuery,
			useMutation: m.useMutation,
			useQueryClient: m.useQueryClient,
			useInfiniteQuery: m.useInfiniteQuery,
		})),

	// Date utilities - import only used functions
	dateFns: {
		format: () => import("date-fns").then((m) => ({ format: m.format })),
		parseISO: () => import("date-fns").then((m) => ({ parseISO: m.parseISO })),
		addDays: () => import("date-fns").then((m) => ({ addDays: m.addDays })),
		subDays: () => import("date-fns").then((m) => ({ subDays: m.subDays })),
		startOfDay: () =>
			import("date-fns").then((m) => ({ startOfDay: m.startOfDay })),
		endOfDay: () => import("date-fns").then((m) => ({ endOfDay: m.endOfDay })),
		isToday: () => import("date-fns").then((m) => ({ isToday: m.isToday })),
		isYesterday: () =>
			import("date-fns").then((m) => ({ isYesterday: m.isYesterday })),
		differenceInDays: () =>
			import("date-fns").then((m) => ({
				differenceInDays: m.differenceInDays,
			})),
		differenceInHours: () =>
			import("date-fns").then((m) => ({
				differenceInHours: m.differenceInHours,
			})),
	},

	// Lodash - import only used functions
	lodash: {
		debounce: () =>
			import("lodash/debounce").then((m) => ({ default: m.default })),
		throttle: () =>
			import("lodash/throttle").then((m) => ({ default: m.default })),
		isEmpty: () =>
			import("lodash/isEmpty").then((m) => ({ default: m.default })),
		isEqual: () =>
			import("lodash/isEqual").then((m) => ({ default: m.default })),
		cloneDeep: () =>
			import("lodash/cloneDeep").then((m) => ({ default: m.default })),
		merge: () => import("lodash/merge").then((m) => ({ default: m.default })),
		pick: () => import("lodash/pick").then((m) => ({ default: m.default })),
		omit: () => import("lodash/omit").then((m) => ({ default: m.default })),
		groupBy: () =>
			import("lodash/groupBy").then((m) => ({ default: m.default })),
		sortBy: () => import("lodash/sortBy").then((m) => ({ default: m.default })),
		uniq: () => import("lodash/uniq").then((m) => ({ default: m.default })),
		chunk: () => import("lodash/chunk").then((m) => ({ default: m.default })),
	},

	// Chart libraries - import only used components
	charts: {
		recharts: () =>
			import("recharts").then((m) => ({
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
			})),
		chartjs: () =>
			import("chart.js/auto").then((m) => ({ default: m.default })),
	},

	// Utility libraries - import only used functions
	utils: {
		clsx: () => import("clsx").then((m) => ({ default: m.default })),
		classNames: () =>
			import("classnames").then((m) => ({ default: m.default })),
		uuid: () => import("uuid").then((m) => ({ v4: m.v4 })),
		nanoid: () => import("nanoid").then((m) => ({ nanoid: m.nanoid })),
		zustand: () => import("zustand").then((m) => ({ default: m.default })),
		immer: () => import("immer").then((m) => ({ produce: m.produce })),
	},
};

// Lazy load components
export const lazyComponents = {
	// Dashboard components
	Dashboard: () =>
		import("@/app/dashboard/page").then((m) => ({ default: m.default })),
	DashboardStats: () =>
		import("@/components/dashboard/DashboardStats").then((m) => ({
			default: m.default,
		})),
	DashboardCharts: () =>
		import("@/components/dashboard/DashboardCharts").then((m) => ({
			default: m.default,
		})),

	// Project components
	ProjectList: () =>
		import("@/components/projects/ProjectList").then((m) => ({
			default: m.default,
		})),
	ProjectCard: () =>
		import("@/components/projects/ProjectCard").then((m) => ({
			default: m.default,
		})),
	ProjectForm: () =>
		import("@/components/projects/ProjectForm").then((m) => ({
			default: m.default,
		})),

	// Task components
	TaskList: () =>
		import("@/components/tasks/TaskList").then((m) => ({ default: m.default })),
	TaskCard: () =>
		import("@/components/tasks/TaskCard").then((m) => ({ default: m.default })),
	TaskForm: () =>
		import("@/components/tasks/TaskForm").then((m) => ({ default: m.default })),

	// Client components
	ClientList: () =>
		import("@/components/clients/ClientList").then((m) => ({
			default: m.default,
		})),
	ClientCard: () =>
		import("@/components/clients/ClientCard").then((m) => ({
			default: m.default,
		})),
	ClientForm: () =>
		import("@/components/clients/ClientForm").then((m) => ({
			default: m.default,
		})),

	// Finance components
	FinanceDashboard: () =>
		import("@/components/finance/FinanceDashboard").then((m) => ({
			default: m.default,
		})),
	TransactionList: () =>
		import("@/components/finance/TransactionList").then((m) => ({
			default: m.default,
		})),
	TransactionForm: () =>
		import("@/components/finance/TransactionForm").then((m) => ({
			default: m.default,
		})),

	// Settings components
	SettingsPanel: () =>
		import("@/components/settings/SettingsPanel").then((m) => ({
			default: m.default,
		})),
	UserManagement: () =>
		import("@/components/settings/UserManagement").then((m) => ({
			default: m.default,
		})),
	SystemSettings: () =>
		import("@/components/settings/SystemSettings").then((m) => ({
			default: m.default,
		})),
};

// Optimized imports for specific features
export const featureImports = {
	// Authentication
	auth: {
		login: () =>
			import("@/lib/auth").then((m) => ({ login: m.login, logout: m.logout })),
		permissions: () =>
			import("@/lib/auth").then((m) => ({
				hasPermission: m.hasPermission,
				getRolePermissions: m.getRolePermissions,
			})),
	},

	// Data management
	data: {
		projects: () =>
			import("@/lib/data").then((m) => ({ mockProjects: m.mockProjects })),
		tasks: () => import("@/lib/data").then((m) => ({ mockTasks: m.mockTasks })),
		clients: () =>
			import("@/lib/data").then((m) => ({ mockClients: m.mockClients })),
		transactions: () =>
			import("@/lib/data").then((m) => ({
				mockTransactions: m.mockTransactions,
			})),
	},

	// Utilities
	utils: {
		formatting: () =>
			import("@/lib/utils").then((m) => ({
				formatCurrency: m.formatCurrency,
				formatDate: m.formatDate,
			})),
		validation: () =>
			import("@/lib/utils").then((m) => ({
				validateEmail: m.validateEmail,
				validatePhone: m.validatePhone,
			})),
	},
};

// Tree shaking helper functions
export const treeShakingHelpers = {
	// Only import what's needed
	importOnly: <T>(importFn: () => Promise<T>, fallback?: T): Promise<T> => {
		try {
			return importFn();
		} catch (error) {
			console.warn("Import failed, using fallback:", error);
			return Promise.resolve(fallback as T);
		}
	},

	// Conditional imports
	conditionalImport: <T>(
		condition: boolean,
		importFn: () => Promise<T>
	): Promise<T | null> => {
		if (condition) {
			return importFn();
		}
		return Promise.resolve(null);
	},

	// Lazy import with error handling
	safeImport: <T>(
		importFn: () => Promise<T>,
		errorHandler?: (error: Error) => void
	): Promise<T | null> => {
		return importFn().catch((error) => {
			if (errorHandler) {
				errorHandler(error);
			} else {
				console.error("Import failed:", error);
			}
			return null;
		});
	},
};

// Bundle size optimization
export const bundleOptimization = {
	// Remove unused exports
	removeUnused: (module: any, usedExports: string[]) => {
		const result: any = {};
		usedExports.forEach((exportName) => {
			if (module[exportName] !== undefined) {
				result[exportName] = module[exportName];
			}
		});
		return result;
	},

	// Split large modules
	splitModule: (module: any, chunks: string[][]) => {
		return chunks.map((chunk) => {
			const result: any = {};
			chunk.forEach((exportName) => {
				if (module[exportName] !== undefined) {
					result[exportName] = module[exportName];
				}
			});
			return result;
		});
	},

	// Optimize imports based on usage
	optimizeImports: (
		imports: Record<string, any>,
		usage: Record<string, boolean>
	) => {
		const optimized: Record<string, any> = {};

		Object.entries(imports).forEach(([key, value]) => {
			if (usage[key]) {
				optimized[key] = value;
			}
		});

		return optimized;
	},
};
