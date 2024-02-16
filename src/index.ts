#!/usr/bin/env node
import DataExtractService from "./data-extract";
import { config } from "dotenv";
import FilesService from "./utils/files";
import { DataUploadService } from "./data-upload";
import SummaryService from "./summary";
import { Command } from "commander";
import { AppConfig, paramsSchema } from "./utils/config";
import packageJson from "../package.json";
import { ZodError } from "zod";
import logger from "./utils/logger";
import { capitalize } from "lodash";

export default class DataSync {
	dataUploadService: DataUploadService;
	dataExtractService: DataExtractService;

	constructor(
		duration?: number,
		pageSize?: number,
		concurrency: { download: number; upload: number } = {
			download: 1,
			upload: 1,
		},
	) {
		const config = AppConfig.getConfig();
		this.dataExtractService = new DataExtractService(duration, pageSize, {
			program: config.dataConfig.program ?? "",
			fields: ":all,attributes[:all,attribute,code,value],enrollments[*],orgUnit,trackedEntityInstance",
			ou: config.dataConfig.organisationUnit ?? "",
			totalPages: true,
			skipPaging: false,
			ouMode: "DESCENDANTS",
			concurrency: concurrency.download,
		});
		this.dataUploadService = new DataUploadService(concurrency.upload);
	}

	async sync(clean: boolean) {
		if (clean) {
			FilesService.clearFiles();
		}
		await SummaryService.init();
		await this.dataExtractService.extractAndUploadData(
			this.dataUploadService.getQueue(),
		);
		this.dataUploadService.setOnQueueComplete(async () => {
			setTimeout(async () => {
				await SummaryService.sendSummary();
			}, 3000);
		});
	}
}

const program = new Command();

program
	.name("tracker-data-sync")
	.description("Sync tracker data between 2 DHIS2 instances")
	.version(packageJson.version);

program
	.command("sync")
	.option(
		"-d --duration <duration>",
		"Duration of the extraction in days",
		"1",
	)
	.option("-p --page-size <page-size>", "Page size of the extraction", "50")
	.option(
		"-u --upload-concurrency <upload-concurrency>",
		"Concurrency of the upload",
		"1",
	)
	.option(
		"--download-concurrency <download-concurrency>",
		"Concurrency of the download",
		"1",
	)
	.option(
		"--config <string>",
		"Absolute location of the configuration JSON file ",
	)
	.action(async (arg) => {
		try {
			const parsedArgs = paramsSchema.parse(arg);
			await AppConfig.initialize(parsedArgs);
			const dataSync = new DataSync(
				arg.duration ? Number(arg.duration) : undefined,
				Number(arg.pageSize),
				{
					download: Number(arg.downloadConcurrency),
					upload: Number(arg.uploadConcurrency,
				,
			);

			console.info(
				`Starting data sync: Duration: ${arg.duration}, Page size: ${arg.pageSize}, Upload concurrency: ${arg.uploadConcurrency}, Download concurrency: ${arg.downloadConcurrency}`
			);
			console.warn("This will delete previously generated files");
			await dataSync.sync(true);
		} catch (error: unknown) {
			if (error instanceof ZodError) {
				error.errors.forEach((e: any) => {
					logger.error({
						message: `${capitalize(e.code.replaceAll("_", " "))}. Expected ${e.expected} but received ${e.received} at ${e.path.join(".")}`
					});
				});
			} else {
				logger.error(error);
			}
			process.exit(1);
		}
	});

config();
program.parse(process.argv);
