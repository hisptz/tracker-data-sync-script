import fs from 'fs';


export default class FilesService {

    static readonly fileExtension = ".json";
    static readonly folderName = "data";


    static makeDir(dirName: string): void {
        if (!fs.existsSync(dirName)) {
            fs.mkdirSync(dirName);
        }
    }


    static async writeFile(fileName: string, data: any): Promise<void> {
        return new Promise((resolve, reject) => {
            const filePath = this.getFilePath(fileName);
            this.makeDir(this.folderName);
            fs.writeFile(filePath, JSON.stringify(data), {}, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve()
                }
            });

        });
    }

    static async readFile(fileName: string): Promise<any> {
        const filePath = this.getFilePath(fileName);
        return new Promise((resolve, reject) => {
            fs.readFile(filePath, 'utf8', (err, data) => {
                if (err) {
                    reject(err);
                }
                resolve(JSON.parse(data));
            });
        });
    }

    static getFilePath(fileName: string): string {
        return `${this.folderName}/${fileName}${this.fileExtension}`;
    }

}


