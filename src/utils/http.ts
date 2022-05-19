import request from 'request';


export function getHttpAuthorizationHeader(
    username: string,
    password: string
): {
    Authorization: string;
    'Content-Type': string;
} {
    return {
        'Content-Type': 'application/json',
        Authorization:
            'Basic ' + Buffer.from(`${username}:${password}`).toString('base64')
    };
}

export class HTTPUtil {

    private url: string | undefined;
    private readonly headers: any;

    constructor(url: string, headers: any) {
        this.url = url;
        this.headers = headers;
    }

    async get(endPoint: string, params?: { [key: string]: any }) {
        return new Promise((resolve, reject) => {
            const url = new URL(`${this.url}/api/${endPoint}`, );
            for (const key in params) {
                url?.searchParams.append(key, params[key]);
            }

            request(
                {
                    headers: this.headers,
                    uri: `${url.href}`,
                    method: 'GET'
                },
                (error, response, body) => {
                    if (!error) {
                        let data = null;
                        try {
                            data = JSON.parse(body);
                        } catch (error: any) {
                            console.log(error.message || error);
                        } finally {
                            resolve(data);
                        }
                    } else {
                        reject(error);
                    }
                }
            );
        });
    }

    async post(endPoint: string, data: any, params?: { [key: string]: any }) {
        return new Promise((resolve, reject) => {
            const url = new URL(`${this.url}/api/${endPoint}`);
            for (const key in params) {
                url?.searchParams.append(key, params[key]);
            }
            request(
                {
                    headers: this.headers,
                    uri: `${url.href}`,
                    method: 'POST',
                    body: JSON.stringify(data)
                },
                (error, response, body) => {
                    if (!error) {
                        let data = null;
                        try {
                            data = JSON.parse(body);
                        } catch (error: any) {
                            console.log(error.message || error);
                        } finally {
                            resolve(data);
                        }
                    } else {
                        reject(error);
                    }
                }
            );
        });
    }

    async delete(endPoint: string) {
        return new Promise((resolve, reject) => {
            const url = new URL(`/api/${endPoint}`, this.url);
            request(
                {
                    headers: this.headers,
                    uri: url.href,
                    method: 'DELETE'
                },
                (error, response, body) => {
                    if (!error) {
                        let data = null;
                        try {
                            data = JSON.parse(body);
                        } catch (error: any) {
                            console.log(error.message || error);
                        } finally {
                            resolve(data);
                        }
                    } else {
                        reject(error);
                    }
                }
            );
        });
    }

    async put(endPoint: string, data: any, params?: { [key: string]: any }) {
        return new Promise((resolve, reject) => {
            const url = new URL(`/api/${endPoint}`, this.url);
            for (const key in params) {
                url?.searchParams.append(key, params[key]);
            }
            request(
                {
                    headers: this.headers,
                    uri: url.href,
                    method: 'PUT',
                    body: JSON.stringify(data)
                },
                (error, response, body) => {
                    if (!error) {
                        let data = null;
                        try {
                            data = JSON.parse(body);
                        } catch (error: any) {
                            console.log(error.message || error);
                        } finally {
                            resolve(data);
                        }
                    } else {
                        reject(error);
                    }
                }
            );
        });
    }
}
