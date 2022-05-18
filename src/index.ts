import DataExtractService, {DataExtractConfig} from "./data-extract";
import {config} from "dotenv";
import FilesService from "./utils/files";


const extractConfig: DataExtractConfig = {
    program: "yDuAzyqYABS",
    fields: ":all,attributes[:all,attribute,code,value],enrollments[*],orgUnit,trackedEntityInstance",
    ou: "m0frOspS7JY",
    ouMode: "DESCENDANTS",
    skipPaging: false,
    totalPages: true,
}


export async function syncData(duration?: number, pageSize?: number, clean?: boolean) {

    if (clean) {
        await FilesService.clearFiles();
    }

    const dataExtractor = new DataExtractService(duration, pageSize, extractConfig);
    await dataExtractor.extractData();
}

config();
syncData(100, 50, true);
