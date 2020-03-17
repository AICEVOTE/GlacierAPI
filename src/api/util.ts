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

export function isArray(obj: unknown | null | undefined): obj is any[] {
    if (obj == null || obj == undefined) { return false; }
    return Object.prototype.toString.call(obj) == "[object Array]";
}

export function isInfluencer(numOfFollowers: number) {
    if (!process.env.NUM_OF_INFLUENCERS_FOLLOWER) {
        return false;
    }
    return numOfFollowers > parseInt(process.env.NUM_OF_INFLUENCERS_FOLLOWER);
}
