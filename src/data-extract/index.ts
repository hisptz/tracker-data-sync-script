import { Pagination } from "./interfaces/pagination";
import { HTTPClient } from "../utils/http";
import logger from "../utils/logger";
import { set } from "lodash";
import { asyncify, mapLimit, QueueObject, timeout } from "async";
import FilesService from "../utils/files";
import SummaryService from "../summary";
import { AppConfig } from "../utils/config";

export interface DataExtractConfig {
	program: string;
	ou: string;
	ouMode: string;
	fields: string;
	skipPaging: false;
	totalPages: true;
	concurrency: number;
}

export default class DataExtractService {
	duration: number | undefined;
	pageSize: number;
	config: DataExtractConfig;

	http: HTTPClient;

	constructor(
		duration: number | undefined,
		pageSize: number | undefined,
		config: DataExtractConfig,
	) {
		this.duration = duration;
		this.pageSize = pageSize ?? 50;

		const appConfig = AppConfig.getConfig();

		const { baseURL, username, password } = appConfig.source;

		if (!baseURL) {
			throw Error("Missing source DHIS2 URL");
		}

		if (!username) {
			throw Error("Missing source username");
		}

		if (!password) {
			throw Error("Missing source password");
		}

		this.http = new HTTPClient({
			baseURL,
			username,
			password,
		});
		this.config = config;
		logger.info({
			message: `Data Extract Service initialized: Source: ${baseURL}`,
			fn: "DataExtractService",
		});
	}

	async extractData() {
		const pagination = await this.getPagination();
		if (pagination) {
			await this.getAllData(pagination.pageCount);
		}
	}

	async extractAndUploadData(uploadQueue: QueueObject<any>) {
		const pagination = await this.getPagination();
		if (pagination) {
			await this.getAllData(pagination.pageCount, uploadQueue);
		}
	}

	async getPagination(): Promise<Pagination | undefined> {
		try {
			const params = {
				pageSize: this.pageSize,
				page: 1,
				...this.config,
			};

			if (this.duration) {
				set(params, "lastUpdatedDuration", `${this.duration}d`);
			}

			const endPoint = `trackedEntityInstances`;
			const data: any = await this.http.get(endPoint, params);

			if (data) {
				const pagination = data.pager;
				logger.info({
					message: `Teis found: ${pagination?.total}, Page size: ${pagination?.pageSize}, Page count: ${pagination?.pageCount}`,
				});
				return {
					...pagination,
				} as Pagination;
			}
		} catch (e: any) {
			logger.error({
				message: e.message,
				stack: e.stack,
				fn: "getPagination",
			});
		}
	}

	async getData(
		page: number,
		http: HTTPClient,
		pageSize: number,
		config: DataExtractConfig,
		uploadQueue?: QueueObject<any>,
	) {
		try {
			const appConfig = AppConfig.getConfig();
			const endPoint = `trackedEntityInstances`;
			const params = {
				page,
				pageSize,
				...config,
			};
			if (this.duration) {
				set(params, "lastUpdatedDuration", `${this.duration}d`);
			}
			logger.info({
				message: `Fetching page ${page}`,
				fn: "getData",
			});

			const data: any = await new Promise<any>((resolve, reject) => {
				timeout(
					asyncify(async () => await http.get(endPoint, params)),
					Number(appConfig.downloadTimeout),
					{},
				)((error, data) => {
					if (error) {
						logger.error({
							message: error.message,
							stack: error.stack,
							fn: "getData",
						});
						SummaryService.updateDownloadSummary(page, "timeout");
						reject(error);
					} else {
						resolve(data);
					}
				});
			});

			if (data) {
				const fileName = await this.saveDataToFile(data, `${page}`);
				logger.info({
					message: `Saved page ${page} to file: ${fileName}`,
					fn: "getData",
				});
				if (uploadQueue) {
					uploadQueue
						.push(`${fileName}`)
						.then((importSummary: any) => {
							logger.info({
								message: `Uploaded page ${page}`,
								fn: "getData",
							});
							SummaryService.updateUploadSummary(
								page,
								importSummary,
							);
						});
				}

				SummaryService.updateDownloadSummary(page, "success");

				return {
					page,
					status: "success",
					message: "Successfully fetched data and saved to file",
				};
			}
		} catch (e: any) {
			logger.error({
				message: e.message,
				stack: e.stack,
				fn: "getData",
			});

			return {
				page,
				status: "error",
				message: e.message,
			};
		}
	}

	async getAllData(pageCount: number, uploadQueue?: QueueObject<any>) {
		const pages = Array.from({ length: pageCount }, (_, i) => i + 1);
		await mapLimit(
			pages,
			this.config.concurrency,
			asyncify(async (page: number) =>
				this.getData(
					page,
					this.http,
					this.pageSize,
					this.config,
					uploadQueue,
				),
			),
		);
	}

	async saveDataToFile(data: any, page: string): Promise<string> {
		const fileName = `${this.config.program}-${this.config.ou}-page-${page}`;
		return await FilesService.writeFile(fileName, data);
	}
}
