import DataExtractService from "./data-extract";
import {config} from "dotenv";
import FilesService from "./utils/files";
import {DataUploadService} from "./data-upload";
import SummaryService from "./summary";
import {Command} from "commander";


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


const program = new Command();

program.name("tracker-data-sync")
    .description("Sync tracker data between 2 DHIS2 instances")
    .version("1.0.0");


program.command("sync")
    .option("-d --duration <duration>", "Duration of the extraction in days", "30")
    .option("-p --page-size <page-size>", "Page size of the extraction", "100")
    .option("-u --upload-concurrency <upload-concurrency>", "Concurrency of the upload", "1")
    .option("-d --download-concurrency <download-concurrency>", "Concurrency of the download", "1")
    .action(async (arg) => {

        const dataSync = new DataSync(Number(arg.duration), Number(arg.pageSize), {
            download: Number(arg.downloadConcurrency),
            upload: Number(arg.uploadConcurrency),

        });

        console.info(`Starting data sync: Duration: ${arg.duration}, Page size: ${arg.pageSize}, Upload concurrency: ${arg.uploadConcurrency}, Download concurrency: ${arg.downloadConcurrency}`);
        console.info("Warning: This will delete previously generated files");
        await dataSync.sync(true);
    });

config();
program.parse(process.argv);
