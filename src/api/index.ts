import themeLoader from "./theme";
import * as model from "../model";
import * as utilAPI from "./util";
import XSSFilters from "xss-filters";

export async function getTopicality(themeID: number) {
    if (themeLoader.themes[themeID] == undefined) { throw new utilAPI.GlacierAPIError("The themeID is invalid"); }
    return await model.Result.find({ themeID: themeID, createdAt: { $gt: Date.now() - 7 * 24 * 60 * 60 * 1000 } }).count();
}

export async function getProfile(sessionToken: string) {
    try {
        const doc = await model.User.findOne({ sessionToken: sessionToken }).exec();
        if (!doc) { throw new utilAPI.GlacierAPIError("The sessionToken is invalid"); }

        return {
            name: doc.name,
            imageURI: doc.imageURI,
            isInfluencer: utilAPI.isInfluencer(doc.numOfFollowers)
        }
    } catch (e) {
        throw e;
    }
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
