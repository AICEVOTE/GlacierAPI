import * as model from "../model";
import * as utilAPI from "./util";
import XSSFilters from "xss-filters";

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
