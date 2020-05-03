import XSSFilters from "xss-filters";
import * as db from "../model";

export async function saveFeedback(message: string, feedbackType: string): Promise<void> {
    await new db.Feedback({
        message: XSSFilters.inHTMLData(message),
        feedbackType
    }).save();
}
