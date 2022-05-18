import DataExtractService from "./data-extract";
import {config} from "dotenv";
import FilesService from "./utils/files";
import {DataUploadService} from "./data-upload";
import SummaryService from "./summary";


export default class DataSync {

    dataUploadService: DataUploadService;
    dataExtractService: DataExtractService;

    constructor(duration?: number, pageSize?: number, concurrency: { download: number, upload: number } = {
        download: 1,
        upload: 1
    }) {
        this.dataExtractService = new DataExtractService(duration, pageSize, {
            program: process.env.PROGRAM_ID ?? "",
            fields: ":all,attributes[:all,attribute,code,value],enrollments[*],orgUnit,trackedEntityInstance",
            ou: process.env.ORGANISATION_UNIT_ID ?? "",
            totalPages: true,
            skipPaging: false,
            ouMode: "DESCENDANTS",
            concurrency: concurrency.download,
        });
        this.dataUploadService = new DataUploadService(concurrency.upload);
    }

    async sync(clean: boolean) {
        if (clean) {
            await FilesService.clearFiles();
        }
        await SummaryService.init();
        this.dataUploadService.setOnQueueComplete(async () => await SummaryService.sendSummary(this.dataExtractService.pageSize, this.dataExtractService.duration))
        await this.dataExtractService.extractAndUploadData(this.dataUploadService.getQueue());
    }

}

config();
new DataSync(200, 50).sync(true);
