import {
	ConflictSummary,
	ImportSummary,
	ImportSummaryResponse,
	Summary,
} from "./interfaces";
import FilesService from "../utils/files";
import NotificationsUtil from "../utils/notification";
import { Duration } from "luxon";
import logger from "../utils/logger";
import { compact, flattenDeep, isEmpty } from "lodash";

export default class SummaryService {
	static async updateUploadSummary(
		page: number,
		importSummary: ImportSummary,
	) {
		const { response } = importSummary ?? {};

		if (response) {
			const summaryData: Summary = await this.getAllSummaryData();
			if (summaryData) {
				const {
					upload: { updated, deleted, ignored, imported },
				} = summaryData ?? {};
				const updatedSummary = {
					...summaryData,
					upload: {
						updated: updated + response.updated,
						ignored: ignored + response.ignored,
						deleted: deleted + response.deleted,
						imported: imported + response.imported,
						conflicts: this.getConflictsFromImportSummaryResponse(
							page,
							response,
						),
					},
				};
				await this.updateSummaryFile(updatedSummary);
			}
		}
	}

	static async updateDownloadSummary(
		page: number,
		status: "success" | "error" | "timeout",
	) {
		if (page && status) {
			const summaryData: Summary = await this.getAllSummaryData();
			if (summaryData) {
				let {
					download: {
						downloaded,
						errors,
						timedOut,
						errorPages,
						timedOutPages,
					},
				} = summaryData ?? {};

				switch (status) {
					case "timeout":
						timedOutPages.push(page);
						timedOut += 1;
						break;
					case "error":
						errorPages.push(page);
						errors += 1;
						break;
					case "success":
						downloaded += 1;
						break;
					default:
						break;
				}

				const updatedSummary = {
					...summaryData,
					download: {
						downloaded,
						errors,
						timedOut,
						errorPages,
						timedOutPages,
					},
				};
				await this.updateSummaryFile(updatedSummary);
			}
		}
	}

	static async getAllSummaryData() {
		const fileName = "summary";
		return await FilesService.readFile(fileName);
	}

	static async updateSummaryFile(summary: Summary) {
		return await FilesService.writeFile("summary", summary);
	}

	static async finishSummary() {
		const endTime = performance.now();
		const summaryData = await this.getAllSummaryData();

		const updatedSummary = {
			...summaryData,
			endTime,
		};
		return await FilesService.writeFile("summary", updatedSummary);
	}

	static async sendSummary(pageSize: number, duration?: number) {
		try {
			await this.finishSummary();
			const { hours, minutes, seconds } =
				(await this.getTimeTaken()) ?? {};
			const attachmentPath = FilesService.getFilePath("summary");
			const message = `Summary for data sync for ${duration === undefined ? "all" : duration} days with page size ${pageSize}. \n Time taken: ${hours} hours, ${minutes} minutes and ${seconds} seconds.`;

			logger.info({
				message,
				fn: "sendSummary",
			});
			NotificationsUtil.send(message, attachmentPath);
		} catch (e: any) {
			logger.error({
				message: e.message,
				stack: e.stack,
			});
		}
	}

	static async getTimeTaken() {
		try {
			const summaryData = await this.getAllSummaryData();
			if (summaryData) {
				const { endTime, startTime } = summaryData ?? {};
				if (endTime && startTime) {
					const duration = Duration.fromMillis(
						endTime - startTime,
					).shiftTo("hours", "minutes", "seconds");
					return {
						hours: parseInt(String(duration.get("hours"))),
						minutes: parseInt(String(duration.get("minutes"))),
						seconds: parseInt(String(duration.get("seconds"))),
					};
				}
			}
		} catch (e: any) {
			logger.error({
				message: e.message,
				stack: e.stack,
			});
		}
	}

	static async init() {
		try {
			const startTime = performance.now();
			const fileName = "summary";
			await FilesService.writeFile(fileName, {
				startTime,
				upload: {
					imported: 0,
					updated: 0,
					deleted: 0,
					ignored: 0,
					conflicts: [],
				},
				download: {
					downloaded: 0,
					errors: 0,
					timedOut: 0,
					errorPages: [],
					timedOutPages: [],
				},
			});
		} catch (e: any) {
			logger.error({
				message: e.message,
				stack: e.stack,
			});
		}
	}

	private static getConflictsFromImportSummaryResponse(
		page: number,
		response: ImportSummaryResponse,
	): ConflictSummary[] {
		if (response) {
			const conflicts = response.importSummaries;
			return (
				compact(
					flattenDeep(
						conflicts.map(({ reference, conflicts }) => {
							if (!isEmpty(conflicts)) {
								return conflicts?.map((conflict) => ({
									conflict,
									reference,
									page,
								}));
							}
							return [];
						}),
					),
				) ?? []
			);
		} else {
			return [];
		}
	}
}
