import {Summary} from "./interfaces";
import FilesService from "../utils/files";
import NotificationsUtil from "../utils/notification";


export default class SummaryService {


    static async updateOrCreate(page: number, summary: any) {
        const summaries = await this.getSummary();
        const index = summaries.findIndex((s: { page: number; }) => s.page === page);
        if (index === -1) {
            summaries.push({...summary});
        } else {
            summaries[index] = {...summaries[index], ...summary};
        }
        await FilesService.writeFile("summary", summaries);
    }

    static async getSummary() {
        const fileName = "summary";
        return await FilesService.readFile(fileName);
    }

    static async sendSummary(pageSize: number, duration?: number) {
        const attachmentPath = FilesService.getFilePath("summary");
        const message = `Summary for data sync for ${duration === undefined ? "all" : duration} days with page size ${pageSize}`;
        NotificationsUtil.send(message, attachmentPath);
    }

    static async init() {
        const fileName = "summary";
        await FilesService.writeFile(fileName, []);
    }
}
