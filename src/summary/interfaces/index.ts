

type Status = "success" | "error" | "timeout" | "pending"

export interface Summary {
    page: number;
    upload: { status: Status, message: string };
    download: { status: Status, message: string };
}
