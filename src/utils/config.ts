import { z } from "zod";
import fs from "fs";

export const paramsSchema = z.object({
	duration: z
		.string()
		.transform((val) => Number(val))
		.optional(),
	pageSize: z
		.string()
		.transform((val) => Number(val))
		.optional(),
	uploadConcurrency: z
		.string()
		.transform((val) => Number(val))
		.optional(),
	downloadConcurrency: z
		.string()
		.transform((val) => Number(val))
		.optional(),
	config: z
		.string()
		.refine((value) => {
			return fs.existsSync(value);
		}, `The configuration file does not exist`)
		.optional(),
});

const dhis2ConnectionSchema = z.object({
	username: z.string(),
	password: z.string(),
	baseURL: z.string(),
});

const notificationConfigSchema = z.object({
	enabled: z.boolean(),
	emailSubject: z.string(),
	recipients: z.array(z.string().email()),
	sendGridKey: z.string(),
	from: z.object({
		name: z.string(),
		email: z.string().email(),
	}),
});

const appConfigPayloadSchema = z.object({
	source: dhis2ConnectionSchema,
	destination: dhis2ConnectionSchema,
	flowConfig: z.object({
		downloadTimeout: z.number(),
		uploadTimeout: z.number(),
	}),
	dataConfig: z.object({
		program: z.string(),
		organisationUnit: z.string(),
	}),
	notificationConfig: notificationConfigSchema,
});

type AppConfigPayload = z.infer<typeof appConfigPayloadSchema>;
type DHIS2Connection = z.infer<typeof dhis2ConnectionSchema>;
type NotificationConfig = z.infer<typeof notificationConfigSchema>;
type Params = z.infer<typeof paramsSchema>;

export class AppConfig {
	private static instance: AppConfig;

	// @ts-ignore
	source: DHIS2Connection;

	params?: Params;
	// @ts-ignore

	destination: DHIS2Connection;

	downloadTimeout: number = 10000;
	uploadTimeout: number = 10000;
	// @ts-ignore
	dataConfig: { program: string; organisationUnit: string };

	notification?: NotificationConfig;

	public static getConfig(): AppConfig {
		return this.getInstance();
	}

	public static getInstance(): AppConfig {
		if (!AppConfig.instance) {
			AppConfig.instance = new AppConfig();
		}
		return AppConfig.instance;
	}

	public static async initialize(args: Params): Promise<void> {
		const config = new AppConfig();
		config.params = args;
		let rawConfig = {};
		if (args.config) {
			rawConfig = await this.getConfigFromJSON(args.config);
		} else {
			rawConfig = this.getConfigFromEnv();
		}

		const validatedRawConfig = appConfigPayloadSchema.safeParse(rawConfig);

		if (!validatedRawConfig.success) {
			// console.log({ configError: validatedRawConfig.error });
			throw validatedRawConfig.error;
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
				sendGridKey: process.env.SENDGRID_API_KEY as string,
				from: {
					email: process.env.EMAIL_FROM_EMAIL as string,
					name: process.env.EMAIL_FROM_NAME as string,
				},
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
