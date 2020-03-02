import * as model from "../model";
import XSSFilters from "xss-filters";

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
