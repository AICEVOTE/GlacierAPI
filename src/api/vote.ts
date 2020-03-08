import themeLoader from "./theme";
import * as model from "../model";
import * as utilAPI from "./util";
import XSSFilters from "xss-filters";

export async function getInfluencerVotes(themeID: number) {
    if (themeLoader.themes[themeID] == undefined) { throw new utilAPI.GlacierAPIError("Invalid themeID"); }

    try {
        return (await model.Result.find({ themeID: themeLoader.themes[themeID].themeID, isInfluencer: true }).exec()).
            map((doc) => {
                return {
                    answer: doc.answer,
                    name: doc.name,
                    imageURI: doc.imageURI
                };
            });
    } catch (e) {
        throw e;
    }
}

export async function getFriendVotes(themeID: number, sessionToken: string) {
    if (themeLoader.themes[themeID] == undefined) { throw new utilAPI.GlacierAPIError("Invalid themeID"); }

    try {
        const doc = await model.User.findOne({ sessionToken: sessionToken }).exec();
        if (!doc) { throw new utilAPI.GlacierAPIError("Invalid sessionToken"); }

        return (await model.Result.find({
            themeID: themeLoader.themes[themeID].themeID, userID: { $in: doc.friends }, userProvider: "twitter"
        }).exec()).map(doc => ({ answer: doc.answer, name: doc.name, imageURI: doc.imageURI }));
    } catch (e) {
        throw e;
    }
}

export async function putVote(themeID: number, sessionToken: string, answer: number) {
    if (themeLoader.themes[themeID] == undefined) { throw new utilAPI.GlacierAPIError("Invalid themeID"); }
    if (themeLoader.themes[themeID].choices[answer] == undefined) {
        throw new utilAPI.GlacierAPIError("Invalid answer");
    }

    const doc = await model.User.findOne({ sessionToken: sessionToken }).exec();
    if (!doc) { throw new utilAPI.GlacierAPIError("Invalid sessionToken"); }

    try {
        await model.Result.updateOne({ themeID: themeLoader.themes[themeID].themeID, userID: doc.userID, userProvider: doc.userProvider },
            {
                $set: {
                    answer: answer, name: doc.name,
                    isInfluencer: utilAPI.isInfluencer(doc.numOfFollowers),
                    imageURI: doc.imageURI, createdAt: Date.now()
                }
            }, { upsert: true }).exec();
    } catch (e) {
        throw e;
    }
}

export async function getComments(themeID: number) {
    if (themeLoader.themes[themeID] == undefined) { throw new utilAPI.GlacierAPIError("Invalid themeID"); }

    try {
        return (await model.Comment.find({ themeID: themeLoader.themes[themeID].themeID }).exec()).
            map((doc) => {
                return {
                    message: doc.message,
                    createdAt: doc.createdAt,
                    name: doc.name,
                    imageURI: doc.imageURI,
                    isInfluencer: doc.isInfluencer
                };
            });
    } catch (e) {
        throw e;
    }
}

export async function postComment(themeID: number, sessionToken: string, message: string) {
    if (themeLoader.themes[themeID] == undefined) { throw new utilAPI.GlacierAPIError("Invalid themeID"); }

    try {
        const doc = await model.User.findOne({ sessionToken: sessionToken }).exec();
        if (!doc) { throw new utilAPI.GlacierAPIError("Invalid sessionToken"); }

        await new model.Comment({
            themeID: themeLoader.themes[themeID].themeID,
            message: XSSFilters.inHTMLData(message),
            createdAt: Date.now() + 1000 * 60 * 60 * 9,
            name: doc.name,
            imageURI: doc.imageURI,
            isInfluencer: utilAPI.isInfluencer(doc.numOfFollowers)
        }).save();
    } catch (e) {
        throw e;
    }
}
