import DataExtractService from "./data-extract";
import {config} from "dotenv";
import FilesService from "./utils/files";
import {DataUploadService} from "./data-upload";
import SummaryService from "./summary";
import {Command} from "commander";
import {DataMapperConfig} from "./data-mapper";
import {TrackedEntityInstance} from "@hisptz/dhis2-utils";
import {forEach, head, set} from "lodash";


const orgUnits = [
    {
        "id": "OEI7mKt18QG",
        "displayName": "Almana Dispensary"
    },
    {
        "id": "nYU8b1WRdF1",
        "displayName": "Bumbwini Makoba PHCU"
    },
    {
        "id": "COo7CTSfrze",
        "displayName": "Bumbwini Misufini PHCU+"
    },
    {
        "id": "HFEpDLVf4U6",
        "displayName": "Chaani Kubwa PHCU"
    },
    {
        "id": "QoC5X3MS6TW",
        "displayName": "Chaani Masingini PHCU"
    },
    {
        "id": "nV1s9WxVRvy",
        "displayName": "Donge Mchangani PHCU"
    },
    {
        "id": "FnEuBakWOAZ",
        "displayName": "Donge Vijibweni PHCU+"
    },
    {
        "id": "CagpQp3xvv9",
        "displayName": "Fujoni PHCU"
    },
    {
        "id": "B0ByrQ9sblI",
        "displayName": "Gamba PHCU"
    },
    {
        "id": "pighU6cRVuO",
        "displayName": "Karibu Dispensary"
    },
    {
        "id": "o4Cb8JdDdQ8",
        "displayName": "Kendwa Dispensary"
    },
    {
        "id": "fgzN2ZRmlTu",
        "displayName": "Kendwa PHCU"
    },
    {
        "id": "hfafnH7BoZF",
        "displayName": "Kidoti PHCU"
    },
    {
        "id": "UmlmhNxrNqN",
        "displayName": "Kijini PHCU"
    },
    {
        "id": "YlzqkXB2Vi8",
        "displayName": "Kiomba Mvua PHCU+"
    },
    {
        "id": "LhOiCz3FD7T",
        "displayName": "Kiongwe PHCU"
    },
    {
        "id": "CuHrwZVeqWx",
        "displayName": "Kitope PHCU"
    },
    {
        "id": "YHXpFkalstA",
        "displayName": "Kitope RC"
    },
    {
        "id": "oGryGG0kBYd",
        "displayName": "Kivunge Cottage Hospital"
    },
    {
        "id": "GTjlJwLvnoT",
        "displayName": "Kiwengwa PHCU"
    },
    {
        "id": "PTSCr2xHWeD",
        "displayName": "Mahonda PHCU+"
    },
    {
        "id": "XvOGIL2nFCy",
        "displayName": "Matemwe Kigomani PHCU"
    },
    {
        "id": "GNhGIM87K1K",
        "displayName": "Matemwe PHCU+"
    },
    {
        "id": "pjrAg6zCVFx",
        "displayName": "Mgonjoni PHC"
    },
    {
        "id": "bHjThBKDP3H",
        "displayName": "Mkokotoni PHCU"
    },
    {
        "id": "qjtCQRvZ9D0",
        "displayName": "Nungwi PHCU+"
    },
    {
        "id": "Uwk7FKFH755",
        "displayName": "Pwani mchangani PHCU"
    },
    {
        "id": "wRQaYrhzdWa",
        "displayName": "Tazari PHCU"
    },
    {
        "id": "dcfqPcpKK3P",
        "displayName": "Tumbatu Gomani PHCU+"
    },
    {
        "id": "NmaTmEFuLN3",
        "displayName": "Tumbatu Jongowe PHCU"
    },
    {
        "id": "dE65OKgF9WZ",
        "displayName": "Upenja PHCU"
    },
    {
        "id": "pt1kqqwHFbb",
        "displayName": "Zingwe Zingwe PHCU"
    }
]

const mapper: DataMapperConfig = {
    mappingFn: function (tei: TrackedEntityInstance) {
        const randomOrgUnit = orgUnits[Math.floor(Math.random() * orgUnits.length)]
        const updatedTei = {...tei};
        set(updatedTei, ['orgUnit'], randomOrgUnit?.id);
        set(updatedTei, ['enrollments', 0, 'orgUnit'], randomOrgUnit.id);
        set(updatedTei, ['programOwners', 'ownerOrgUnit'], randomOrgUnit.id);
        forEach(head(tei.enrollments)?.events, (event, index) => {
            set(updatedTei, ['enrollments', 0, 'events', index, 'orgUnit'], randomOrgUnit?.id)
        })

        return updatedTei;
    }
}


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
            totalPages: true,
            skipPaging: false,
            ouMode: "ACCESSIBLE",
            concurrency: concurrency.download,
        }, mapper);
        this.dataUploadService = new DataUploadService(concurrency.upload);
    }

    async sync(clean: boolean) {
        if (clean) {
            await FilesService.clearFiles();
        }
        await SummaryService.init();
        await this.dataExtractService.extractAndUploadData(this.dataUploadService.getQueue());
        this.dataUploadService.setOnQueueComplete(async () => {
            setTimeout(async () => {
                await SummaryService.sendSummary(this.dataExtractService.pageSize, this.dataExtractService.duration)
            }, 3000);
        })
    }

}

const program = new Command();

program.name("tracker-data-sync")
    .description("Sync tracker data between 2 DHIS2 instances")
    .version("1.0.0");

program.command("sync")
    .option("-d --duration <duration>", "Duration of the extraction in days", undefined)
    .option("-p --page-size <page-size>", "Page size of the extraction", "50")
    .option("-u --upload-concurrency <upload-concurrency>", "Concurrency of the upload", "1")
    .option("-d --download-concurrency <download-concurrency>", "Concurrency of the download", "1")
    .action(async (arg) => {

        const dataSync = new DataSync(arg.duration ? Number(arg.duration) : undefined, Number(arg.pageSize), {
            download: Number(arg.downloadConcurrency),
            upload: Number(arg.uploadConcurrency),
        });

        console.info(`Starting data sync: Duration: ${arg.duration}, Page size: ${arg.pageSize}, Upload concurrency: ${arg.uploadConcurrency}, Download concurrency: ${arg.downloadConcurrency}`);
        console.warn("Warning: This will delete previously generated files");
        await dataSync.sync(true);
    });

config();
program.parse(process.argv);
