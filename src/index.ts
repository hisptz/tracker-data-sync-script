import DataExtractService, {DataExtractConfig} from "./data-extract";
import {config} from "dotenv";


const extractConfig: DataExtractConfig = {
    program: "yDuAzyqYABS",
    fields: ":all,attributes[:all,attribute,code,value],enrollments[*],orgUnit,trackedEntityInstance",
    ou: "m0frOspS7JY",
    ouMode: "DESCENDANTS",
    skipPaging: false,
    totalPages: true,
}


export async function syncData(duration?: number, pageSize?: number) {
    const dataExtractor = new DataExtractService(duration, pageSize, extractConfig);
    await dataExtractor.extractData();
}

config();
syncData(100, 50);
