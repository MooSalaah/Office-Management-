const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export const api = {
	// Projects
	async getProjects() {
		const response = await fetch(`${API_BASE_URL}/api/projects`);
		return response.json();
	},

	async createProject(project: any) {
		const response = await fetch(`${API_BASE_URL}/api/projects`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(project),
		});
		return response.json();
	},

	async updateProject(id: string, project: any) {
		const response = await fetch(`${API_BASE_URL}/api/projects/${id}`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(project),
		});
		return response.json();
	},

	async deleteProject(id: string) {
		const response = await fetch(`${API_BASE_URL}/api/projects/${id}`, {
			method: "DELETE",
		});
		return response.json();
	},

	// Tasks
	async getTasks() {
		const response = await fetch(`${API_BASE_URL}/api/tasks`);
		return response.json();
	},

	async createTask(task: any) {
		const response = await fetch(`${API_BASE_URL}/api/tasks`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(task),
		});
		return response.json();
	},

	async updateTask(id: string, task: any) {
		const response = await fetch(`${API_BASE_URL}/api/tasks/${id}`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(task),
		});
		return response.json();
	},

	async deleteTask(id: string) {
		const response = await fetch(`${API_BASE_URL}/api/tasks/${id}`, {
			method: "DELETE",
		});
		return response.json();
	},

	// Clients
	async getClients() {
		const response = await fetch(`${API_BASE_URL}/api/clients`);
		return response.json();
	},

	async createClient(client: any) {
		const response = await fetch(`${API_BASE_URL}/api/clients`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(client),
		});
		return response.json();
	},

	async updateClient(id: string, client: any) {
		const response = await fetch(`${API_BASE_URL}/api/clients/${id}`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(client),
		});
		return response.json();
	},

	async deleteClient(id: string) {
		const response = await fetch(`${API_BASE_URL}/api/clients/${id}`, {
			method: "DELETE",
		});
		return response.json();
	},

	// Users
	async getUsers() {
		const response = await fetch(`${API_BASE_URL}/api/users`);
		return response.json();
	},

	async createUser(user: any) {
		const response = await fetch(`${API_BASE_URL}/api/users`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(user),
		});
		return response.json();
	},

	async updateUser(id: string, user: any) {
		const response = await fetch(`${API_BASE_URL}/api/users/${id}`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(user),
		});
		return response.json();
	},

	async deleteUser(id: string) {
		const response = await fetch(`${API_BASE_URL}/api/users/${id}`, {
			method: "DELETE",
		});
		return response.json();
	},
};
