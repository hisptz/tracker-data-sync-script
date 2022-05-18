import DataExtractService, {DataExtractConfig} from "./data-extract";
import {config} from "dotenv";
import FilesService from "./utils/files";
import {QueueObject} from "async";
import {DataUploadService} from "./data-upload";


const extractConfig: DataExtractConfig = {
    program: "yDuAzyqYABS",
    fields: ":all,attributes[:all,attribute,code,value],enrollments[*],orgUnit,trackedEntityInstance",
    ou: "m0frOspS7JY",
    ouMode: "DESCENDANTS",
    skipPaging: false,
    totalPages: true,
}


export default class DataSync {


    dataUploadService: DataUploadService;
    dataExtractService: DataExtractService;

    constructor(duration?: number, pageSize?: number) {
        this.dataExtractService = new DataExtractService(duration, pageSize, extractConfig);
        this.dataUploadService = new DataUploadService();
    }

    async sync(clean: boolean) {
        if (clean) {
            await FilesService.clearFiles();
        }
        await this.dataExtractService.extractAndUploadData(this.dataUploadService.getQueue());
    }

}

config();
new DataSync(100, 50,).sync(true);
