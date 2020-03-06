export class GlacierAPIError extends Error {
    name: string = "GlacierAPIError";
    message: string;
    constructor(message: string = "API call failed") {
        super()
        this.message = message;
    }
}

export function isString(obj: unknown | null | undefined): obj is string {
    if (obj == null || obj == undefined) { return false; }
    return typeof obj == "string";
}

export function isNumber(obj: unknown | null | undefined): obj is number {
    if (obj == null || obj == undefined) { return false; }
    return typeof obj == "number";
}

export function isBoolean(obj: unknown | null | undefined): obj is boolean {
    if (obj == null || obj == undefined) { return false; }
    return typeof obj == "boolean";
}

export function isInfluencer(numOfFollowers: number) {
    return numOfFollowers > 50000;
}
