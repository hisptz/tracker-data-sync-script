import {Pagination} from "./interfaces/pagination";
import {getHttpAuthorizationHeader, HTTPUtil} from "../utils/http";
import logger from "../utils/logger";
import {set} from "lodash";
import {asyncify, map, mapLimit} from "async";
import FilesService from "../utils/files";

export interface DataExtractConfig {
    program: string;
    ou: string;
    ouMode: string;
    fields: string;
    skipPaging: false;
    totalPages: true;
}


export default class DataExtractService {

    duration: number | undefined;
    pageSize: number;
    config: DataExtractConfig;

    sourceURL: URL;

    http: HTTPUtil;


    constructor(duration: number | undefined, pageSize: number | undefined, config: DataExtractConfig) {
        this.duration = duration;
        this.pageSize = pageSize ?? 50;
        this.sourceURL = new URL("/api", process.env.SOURCE_DHIS2_BASE_URL ?? "");
        this.http = new HTTPUtil(this.sourceURL, getHttpAuthorizationHeader(process.env.SOURCE_DHIS2_USERNAME ?? "", process.env.SOURCE_DHIS2_PASSWORD ?? ""));
        this.config = config;

        logger.info({
            message: `DataExtractService initialized: Source: ${this.sourceURL.href}`,
            fn: "DataExtractService",
        })
    }

    async extractData() {

        const pagination = await this.getPagination();
        if (pagination) {
            await this.getAllData(pagination.pageCount);
        }

    }

    async getPagination(): Promise<Pagination | undefined> {
        try {
            const params = {
                pageSize: this.pageSize,
                page: 1,
                ...this.config,
            }

            if (this.duration) {
                set(params, "lastUpdatedDuration", `${this.duration}d`);
            }

            const endPoint = `trackedEntityInstances`;
            const data: any = await this.http.get(endPoint, params);

            if (data) {
                const pagination = data.pager;
                logger.info({
                    message: `Teis found: ${pagination?.total}, Page size: ${pagination?.pageSize}, Page count: ${pagination?.pageCount}`,
                })
                return {
                    ...pagination,
                } as Pagination;
            }

        } catch (e: any) {
            logger.error({
                message: e.message,
                stack: e.stack,
                fn: "getPagination",
            });
        }
    }

    async getData(page: number, http: HTTPUtil, pageSize: number, config: DataExtractConfig) {
        try {
            const endPoint = `trackedEntityInstances`;
            const params = {
                page,
                pageSize,
                ...config,
            }
            if (this.duration) {
                set(params, "lastUpdatedDuration", `${this.duration}d`);
            }
            logger.info({
                message: `Fetching page ${page}`,
                fn: "getData",
            })
            const data: any = await http.get(endPoint, params);

            if (data) {
                await this.saveDataToFile(data, page);
            }
        } catch (e: any) {
            logger.error({
                message: e.message,
                stack: e.stack,
                fn: "getData",
            });
        }
    }

    async getAllData(pageCount: number) {
        const pages = Array.from({length: pageCount}, (_, i) => i + 1);
        await mapLimit(pages, 10, asyncify(async (page: number) => this.getData(page, this.http, this.pageSize, this.config)));
    }

    async saveDataToFile(data: any, page: number) {
        await FilesService.writeFile(`${this.config.program}-${this.config.ou}-page-${page}`, data);
    }

}
