type Status = "success" | "error" | "timeout" | "pending"


export interface ConflictSummary {
    page: number;
    reference: string;
    conflict: {
        object: string,
        value: string
    }

}

export interface UploadSummary {
    imported: number;
    updated: number;
    deleted: number;
    ignored: number;
    conflicts?: ConflictSummary[]
}

export interface DownloadSummary {
    downloaded: number;
    errors: number;
    timedOut: number;
    errorPages: number[];
    timedOutPages: number[];
}


export interface Summary {
    startTime?: number;
    endTime?: number;
    upload: UploadSummary
    download: DownloadSummary
}


export interface SingleImportSummary {
    responseType: string;
    status: string;
    importCount: { imported: number, updated: number, ignored: number, deleted: number }
    conflicts: { object: string, value: string }[]
    reference: string
}

export interface ImportSummaryResponse {
    responseType: string;
    status: string;
    imported: number;
    updated: number;
    deleted: number;
    ignored: number;
    importSummaries: SingleImportSummary[]
}

export interface ImportSummary {
    httpStatus: string;
    httpStatusCode: number;
    status: string;
    message: string;
    response: ImportSummaryResponse
}
