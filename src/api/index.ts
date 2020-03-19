import themeLoader from "./theme";
import * as model from "../model";
import XSSFilters from "xss-filters";

export async function getTopicality(themeID: number) {
    if (themeLoader.themes[themeID] == undefined) { throw new Error("Invalid themeID"); }
    const votes = await model.Vote.find({
        themeID: themeID,
        createdAt: { $gt: Date.now() - 7 * 24 * 60 * 60 * 1000 }
    }).countDocuments().exec();
    const comments = await model.Comment.find({
        themeID: themeID,
        createdAt: { $gt: Date.now() - 7 * 24 * 60 * 60 * 1000 }
    }).countDocuments().exec();
    return votes + comments;
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
    return sanitizedMessage;
}
