// API helper for connecting to backend server
const API_BASE_URL =
	process.env.NEXT_PUBLIC_API_URL ||
	"https://office-management-fsy7.onrender.com";

export interface ApiResponse<T = any> {
	success: boolean;
	data?: T;
	error?: string;
	message?: string;
}

class ApiClient {
	private baseUrl: string;
	private retryAttempts = 3;
	private retryDelay = 1000;

	constructor(baseUrl: string) {
		this.baseUrl = baseUrl;
	}

	private async request<T>(
		endpoint: string,
		options: RequestInit = {},
		retryCount = 0
	): Promise<ApiResponse<T>> {
		try {
			const url = `${this.baseUrl}${endpoint}`;
			const response = await fetch(url, {
				headers: {
					"Content-Type": "application/json",
					"Cache-Control": "no-cache",
					Pragma: "no-cache",
					...options.headers,
				},
				...options,
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const data = await response.json();
			return data;
		} catch (error) {
			console.error(`API request failed for ${endpoint}:`, error);

			// Retry logic for network errors
			if (retryCount < this.retryAttempts && this.isRetryableError(error)) {
				console.log(
					`Retrying request (${retryCount + 1}/${this.retryAttempts})...`
				);
				await this.delay(this.retryDelay * (retryCount + 1));
				return this.request(endpoint, options, retryCount + 1);
			}

			return {
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
			};
		}
	}

	private isRetryableError(error: any): boolean {
		// Retry on network errors, not on 4xx client errors
		return (
			error instanceof TypeError ||
			(error.message && error.message.includes("fetch"))
		);
	}

	private delay(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
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

	// Health check
	async healthCheck() {
		return this.request("/");
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
	health: () => apiClient.healthCheck(),
};
