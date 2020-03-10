import themeLoader from "./theme";
import * as model from "../model";
import * as utilAPI from "./util";
import XSSFilters from "xss-filters";

export async function getTopicality(themeID: number) {
    if (themeLoader.themes[themeID] == undefined) { throw new utilAPI.GlacierAPIError("Invalid themeID"); }
    return await model.Vote.find({
        themeID: themeID,
        createdAt: { $gt: Date.now() - 7 * 24 * 60 * 60 * 1000 }
    }).countDocuments().exec();
}

export async function getMyProfile(sessionToken: string) {
    try {
        const doc = await model.User.findOne({ sessionToken: sessionToken }).exec();
        if (!doc) { throw new utilAPI.GlacierAPIError("Invalid sessionToken"); }

        return {
            userProvider: doc.userProvider,
            userID: doc.userID,
            name: doc.name,
            imageURI: doc.imageURI,
            isInfluencer: utilAPI.isInfluencer(doc.numOfFollowers)
        }
    } catch (e) {
        throw e;
    }
}

export async function getProfiles(users: { userProvider: string, userID: string }[]) {
    try {
        const docs = await model.User.find({ $or: users }).exec();

        return docs.map(doc => ({
            userProvider: doc.userProvider,
            userID: doc.userID,
            name: doc.name,
            imageURI: doc.imageURI,
            isInfluencer: utilAPI.isInfluencer(doc.numOfFollowers)
        }));
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
