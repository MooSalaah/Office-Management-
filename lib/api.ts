// API helper for connecting to backend server
const API_BASE_URL =
	process.env.NEXT_PUBLIC_API_URL ||
	"https://engineering-office-backend.onrender.com";

export interface ApiResponse<T = any> {
	success: boolean;
	data?: T;
	error?: string;
	message?: string;
}

class ApiClient {
	private baseUrl: string;

	constructor(baseUrl: string) {
		this.baseUrl = baseUrl;
	}

	private async request<T>(
		endpoint: string,
		options: RequestInit = {}
	): Promise<ApiResponse<T>> {
		try {
			const url = `${this.baseUrl}${endpoint}`;
			console.log(`API Request: ${options.method || "GET"} ${url}`);

			const response = await fetch(url, {
				headers: {
					"Content-Type": "application/json",
					...options.headers,
				},
				...options,
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const data = await response.json();
			console.log(`API Response:`, data);
			return data;
		} catch (error) {
			console.error(`API request failed for ${endpoint}:`, error);
			return {
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
			};
		}
	}

	// Projects API
	async getProjects() {
		return this.request("/api/projects");
	}

	async createProject(projectData: any) {
		return this.request("/api/projects", {
			method: "POST",
			body: JSON.stringify(projectData),
		});
	}

	async updateProject(id: string, projectData: any) {
		return this.request(`/api/projects/${id}`, {
			method: "PUT",
			body: JSON.stringify(projectData),
		});
	}

	async deleteProject(id: string) {
		return this.request(`/api/projects/${id}`, {
			method: "DELETE",
		});
	}

	// Tasks API
	async getTasks() {
		return this.request("/api/tasks");
	}

	async createTask(taskData: any) {
		return this.request("/api/tasks", {
			method: "POST",
			body: JSON.stringify(taskData),
		});
	}

	async updateTask(id: string, taskData: any) {
		return this.request(`/api/tasks/${id}`, {
			method: "PUT",
			body: JSON.stringify(taskData),
		});
	}

	async deleteTask(id: string) {
		return this.request(`/api/tasks/${id}`, {
			method: "DELETE",
		});
	}

	// Clients API
	async getClients() {
		return this.request("/api/clients");
	}

	async createClient(clientData: any) {
		return this.request("/api/clients", {
			method: "POST",
			body: JSON.stringify(clientData),
		});
	}

	async updateClient(id: string, clientData: any) {
		return this.request(`/api/clients/${id}`, {
			method: "PUT",
			body: JSON.stringify(clientData),
		});
	}

	async deleteClient(id: string) {
		return this.request(`/api/clients/${id}`, {
			method: "DELETE",
		});
	}

	// Users API
	async getUsers() {
		return this.request("/api/users");
	}

	async createUser(userData: any) {
		return this.request("/api/users", {
			method: "POST",
			body: JSON.stringify(userData),
		});
	}

	async updateUser(id: string, userData: any) {
		return this.request(`/api/users/${id}`, {
			method: "PUT",
			body: JSON.stringify(userData),
		});
	}

	async deleteUser(id: string) {
		return this.request(`/api/users/${id}`, {
			method: "DELETE",
		});
	}

	// Auth API
	async login(credentials: { email: string; password: string }) {
		return this.request("/api/auth/login", {
			method: "POST",
			body: JSON.stringify(credentials),
		});
	}

	async register(userData: any) {
		return this.request("/api/auth/register", {
			method: "POST",
			body: JSON.stringify(userData),
		});
	}
}

// Create and export API client instance
export const apiClient = new ApiClient(API_BASE_URL);

// Export individual API functions for convenience
export const api = {
	projects: {
		getAll: () => apiClient.getProjects(),
		create: (data: any) => apiClient.createProject(data),
		update: (id: string, data: any) => apiClient.updateProject(id, data),
		delete: (id: string) => apiClient.deleteProject(id),
	},
	tasks: {
		getAll: () => apiClient.getTasks(),
		create: (data: any) => apiClient.createTask(data),
		update: (id: string, data: any) => apiClient.updateTask(id, data),
		delete: (id: string) => apiClient.deleteTask(id),
	},
	clients: {
		getAll: () => apiClient.getClients(),
		create: (data: any) => apiClient.createClient(data),
		update: (id: string, data: any) => apiClient.updateClient(id, data),
		delete: (id: string) => apiClient.deleteClient(id),
	},
	users: {
		getAll: () => apiClient.getUsers(),
		create: (data: any) => apiClient.createUser(data),
		update: (id: string, data: any) => apiClient.updateUser(id, data),
		delete: (id: string) => apiClient.deleteUser(id),
	},
	auth: {
		login: (credentials: { email: string; password: string }) =>
			apiClient.login(credentials),
		register: (userData: any) => apiClient.register(userData),
	},
};

// Data synchronization utilities
export const syncData = {
	// Sync projects from API to local storage
	async syncProjects() {
		try {
			const response = await api.projects.getAll();
			if (response.success && response.data) {
				localStorage.setItem("projects", JSON.stringify(response.data));
				return response.data;
			}
			return [];
		} catch (error) {
			console.error("Error syncing projects:", error);
			return [];
		}
	},

	// Sync tasks from API to local storage
	async syncTasks() {
		try {
			const response = await api.tasks.getAll();
			if (response.success && response.data) {
				localStorage.setItem("tasks", JSON.stringify(response.data));
				return response.data;
			}
			return [];
		} catch (error) {
			console.error("Error syncing tasks:", error);
			return [];
		}
	},

	// Sync clients from API to local storage
	async syncClients() {
		try {
			const response = await api.clients.getAll();
			if (response.success && response.data) {
				localStorage.setItem("clients", JSON.stringify(response.data));
				return response.data;
			}
			return [];
		} catch (error) {
			console.error("Error syncing clients:", error);
			return [];
		}
	},

	// Sync users from API to local storage
	async syncUsers() {
		try {
			const response = await api.users.getAll();
			if (response.success && response.data) {
				localStorage.setItem("users", JSON.stringify(response.data));
				return response.data;
			}
			return [];
		} catch (error) {
			console.error("Error syncing users:", error);
			return [];
		}
	},

	// Sync all data
	async syncAll() {
		console.log("Starting data synchronization...");
		const [projects, tasks, clients, users] = await Promise.all([
			this.syncProjects(),
			this.syncTasks(),
			this.syncClients(),
			this.syncUsers(),
		]);
		console.log("Data synchronization completed");
		return { projects, tasks, clients, users };
	},
};
