import { z } from "zod";
import fs from "fs";

const appConfigPayloadSchema = z.object({
	source: z.object({
		username: z.string(),
		password: z.string(),
		baseURL: z.string(),
	}),
	destination: z.object({
		username: z.string(),
		password: z.string(),
		baseURL: z.string(),
	}),
	flowConfig: z.object({
		downloadTimeout: z.number(),
		uploadTimeout: z.number(),
	}),
	dataConfig: z.object({
		program: z.string(),
		organisationUnit: z.string(),
	}),
	notificationConfig: z.object({
		enabled: z.boolean(),
		emailSubject: z.string(),
		recipients: z.array(z.string()),
	}),
});

type AppConfigPayload = z.infer<typeof appConfigPayloadSchema>;

export class AppConfig {
	private static instance: AppConfig;

	// @ts-ignore
	source: { baseURL: string; username: string; password: string };
	// @ts-ignore

	destination: { baseURL: string; username: string; password: string };

	downloadTimeout: number = 10000;
	uploadTimeout: number = 10000;
	// @ts-ignore
	dataConfig: { program: string; organisationUnit: string };

	notification?: {
		enabled: boolean;
		emailSubject: string;
		recipients: string[];
	};

	public static getConfig(): AppConfig {
		return this.getInstance();
	}

	public static getInstance(): AppConfig {
		if (!AppConfig.instance) {
			AppConfig.instance = new AppConfig();
		}
		return AppConfig.instance;
	}

	public static async initialize(configLocation?: string): Promise<void> {
		const config = new AppConfig();
		let rawConfig = {};
		if (configLocation) {
			rawConfig = await this.getConfigFromJSON(configLocation);
		} else {
			rawConfig = this.getConfigFromEnv();
		}

		const validatedRawConfig = appConfigPayloadSchema.safeParse(rawConfig);

		if (!validatedRawConfig.success) {
			throw validatedRawConfig.error.message;
		}

		this.setConfigFromRawConfig(config, validatedRawConfig.data);

		this.instance = config;
	}

	private static getConfigFromEnv(): AppConfigPayload {
		return {
			source: {
				baseURL: process.env.SOURCE_DHIS2_BASE_URL as string,
				username: process.env.SOURCE_DHIS2_USERNAME as string,
				password: process.env.SOURCE_DHIS2_PASSWORD as string,
			},
			destination: {
				baseURL: process.env.DESTINATION_DHIS2_BASE_URL as string,
				username: process.env.DESTINATION_DHIS2_USERNAME as string,
				password: process.env.DESTINATION_DHIS2_PASSWORD as string,
			},
			flowConfig: {
				downloadTimeout: isNaN(Number(process.env.DOWNLOAD_TIMEOUT))
					? 10000
					: Number(process.env.DOWNLOAD_TIMEOUT),
				uploadTimeout: isNaN(Number(process.env.UPLOAD_TIMEOUT))
					? 10000
					: Number(process.env.UPLOAD_TIMEOUT),
			},
			dataConfig: {
				organisationUnit: process.env.ORGANISATION_UNIT_ID as string,
				program: process.env.PROGRAM_ID as string,
			},
			notificationConfig: {
				emailSubject: process.env.EMAIL_SUBJECT as string,
				enabled: process.env.ENABLE_NOTIFICATIONS === "true" ?? false,
				recipients: JSON.parse(process.env.EMAIL_RECIPIENTS ?? "[]"),
			},
		};
	}

	private static async getConfigFromJSON(
		location: string,
	): Promise<AppConfigPayload> {
		const data = await new Promise((resolve, reject) => {
			fs.readFile(location, "utf8", (err, data) => {
				if (err) {
					reject(err);
				}
				if (data) {
					resolve(JSON.parse(data));
				} else {
					resolve({});
				}
			});
		});

		return data as AppConfigPayload;
	}

	private static setConfigFromRawConfig(
		config: AppConfig,
		rawConfig: AppConfigPayload,
	): void {
		config.source = rawConfig.source;
		config.destination = rawConfig.destination;

		config.downloadTimeout = rawConfig.flowConfig.downloadTimeout;
		config.uploadTimeout = rawConfig.flowConfig.uploadTimeout;

		config.dataConfig = rawConfig.dataConfig;

		config.notification = rawConfig.notificationConfig;
	}
}
