import {getHttpAuthorizationHeader, HTTPUtil} from "../utils/http";
import FilesService from "../utils/files";
import {asyncify, QueueObject, queue} from "async";
import logger from "../utils/logger";


export class DataUploadService {

    http: HTTPUtil;
    queue: QueueObject<any>;

    constructor(concurrency: number) {

        this.uploadDataFromFile = this.uploadDataFromFile.bind(this);
        const url = new URL(process.env.DESTINATION_DHIS2_BASE_URL ?? "")
        this.http = new HTTPUtil(url, getHttpAuthorizationHeader(process.env.DESTINATION_DHIS2_USERNAME ?? "", process.env.DESTINATION_DHIS2_PASSWORD ?? ""));
        this.queue = queue(asyncify(this.uploadDataFromFile), concurrency);

    }

    setOnQueueComplete(callback: () => Promise<void>) {
        this.queue.drain(callback);
    }

    cancelUpload() {
        this.queue.kill();
    }

    pauseUpload() {
        this.queue.pause();
    }

    getQueue() {
        return this.queue;
    }

    async uploadData(data: any) {
        try {
            const endPoint = `trackedEntityInstances`;
            return await this.http.post(endPoint, data, {
                strategy: "CREATE_AND_UPDATE",
            });
        } catch (e: any) {
            logger.error({
                message: `Error uploading data to destination: ${e.message}`,
                fn: "uploadData",
            })
        }
    }

    async uploadDataFromFile(filePath: string) {
        const data = await FilesService.readFile(filePath);
        logger.info({
            message: `Uploading data from file: ${filePath}`,
            fn: "uploadDataFromFile",
        })
        if (data) {
            return await this.uploadData(data).then((response: any) => {
                logger.info({
                    message: `Data from file ${filePath} uploaded successfully`,
                    fn: "uploadDataFromFile",
                })
                return response;
            }).catch((e: any) => {
                logger.error({
                    message: e.message,
                    stack: e.stack
                })
            });
        }
    }
}
