import axios, { Axios } from "axios";

export class HTTPClient {
	private client: Axios;

	constructor({
		baseURL,
		username,
		password,
	}: {
		baseURL: string;
		username: string;
		password: string;
	}) {
		this.client = axios.create({
			baseURL: `${baseURL}/api`,
			auth: {
				username,
				password,
			},
			headers: {
				"Content-Type": "application/json",
			},
			withCredentials: true,
		});
	}

	getURL({
		endpoint,
		params,
	}: {
		endpoint: string;
		params?: { [key: string]: any };
	}) {
		const searchParams = new URLSearchParams(params);
		return `${endpoint}?${searchParams.toString()}`;
	}

	async get<ResponseType>(endpoint: string, params?: { [key: string]: any }) {
		const url = this.getURL({ endpoint, params });
		const response = await this.client.get<ResponseType>(url);
		return response.data;
	}

	async post<ResponseType>(
		endpoint: string,
		data: any,
		params?: { [key: string]: any },
	) {
		const url = this.getURL({ endpoint, params });
		const response = await this.client.post<ResponseType>(url, data);
		return response.data;
	}

	async delete(endpoint: string) {
		const url = this.getURL({ endpoint });
		const response = await this.client.delete(url);
		return response.data;
	}

	async put<ResponseType>(
		endpoint: string,
		data: any,
		params?: { [key: string]: any },
	) {
		const url = this.getURL({ endpoint, params });
		const response = await this.client.put<ResponseType>(url, data);
		return response.data;
	}
}
