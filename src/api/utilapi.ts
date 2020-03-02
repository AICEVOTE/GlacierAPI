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
    return themeLoader.themes[id] != undefined;
}

export async function saveFeedback(message: string, feedbackType: string) {
    const sanitizedMessage = XSSFilters.inHTMLData(message);

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
