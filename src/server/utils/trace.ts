// tslint:disable: unified-signatures
// tslint:disable: no-console

export let logEnabled = true;
export let infoEnabled = true;
export let debugEnabled = true;

export function log(buffer: string[]): void;
export function log(message: string): void;
export function log(object: object): void;
export function log(data: any): void {
    if (logEnabled) {
        console.log(getMessage(data));
    }
}

export function error(buffer: string[]): void;
export function error(message: string): void;
export function error(object: object): void;
export function error(data: any): void {
    console.error(getMessage(data));
}

export function info(buffer: string[]): void;
export function info(message: string): void;
export function info(object: object): void;
export function info(data: any): void {
    if (infoEnabled) {
        console.info(getMessage(data));
    }
}

export function debug(buffer: string[]): void;
export function debug(message: string): void;
export function debug(object: object): void;
export function debug(data: any): void {
    if (debugEnabled) {
        console.debug(getMessage(data));
    }
}

export function getMessage(data: any): string {
    const messageBuffer: string[] = [getTimestamp(), `: `];
    if (Array.isArray(data)) {
        messageBuffer.concat(data);
    } else if (typeof data === "string") {
        messageBuffer.push(data);
    } else if (typeof data === "object") {
        messageBuffer.push(`\n`);
        messageBuffer.push(JSON.stringify(data, null, 2));
    }

    return messageBuffer.join("");
}

export function getTimestamp(): string {
    return new Date().toLocaleString();
}
