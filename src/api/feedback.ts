import XSSFilters from "xss-filters";
import * as db from "../model";

export async function saveFeedback(message: string, feedbackType: string) {
    const sanitizedMessage = XSSFilters.inHTMLData(message);

    await new db.Feedback({
        message: sanitizedMessage,
        feedbackType
    }).save();
    return sanitizedMessage;
}
