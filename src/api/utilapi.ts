import themeLoader from "./theme";
import * as model from "../model";
import XSSFilters from "xss-filters";

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

export function isCompatibleId(id: number) {
    return Number.isInteger(id) && id >= 0 && id < themeLoader.themes.length;
}

export function generateSessionID() {
    const l = 256;
    const c = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let r = "";
    for (let i = 0; i < l; i++) {
        r += c[Math.floor(Math.random() * c.length)];
    }
    return r;
}

export function sanitize(str: string) {
    return XSSFilters.inHTMLData(str);
}

export async function saveFeedback(message: string, feedbackType: string) {
    const sanitizedMessage = sanitize(message);

    try {
        await new model.Feedback({
            message: sanitizedMessage,
            feedbackType: feedbackType
        }).save();
    } catch (e) {
        throw e;
    }
    return { message: sanitizedMessage };
}
