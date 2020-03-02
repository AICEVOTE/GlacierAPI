import themeLoader from "./theme";
import * as model from "../model";
import * as utilAPI from "./util";
import XSSFilters from "xss-filters";

export async function getInfluencerVotes(id: number) {
    if (themeLoader.themes[id] == undefined) { throw new utilAPI.GlacierAPIError("The id is invalid"); }

    try {
        return (await model.Result.find({ id: themeLoader.themes[id].id, isInfluencer: true }).exec()).
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

export async function getFriendVotes(id: number, sessionToken: string) {
    if (themeLoader.themes[id] == undefined) { throw new utilAPI.GlacierAPIError("The id is invalid"); }

    try {
        const doc = await model.User.findOne({ sessionToken: sessionToken }).exec();
        if (!doc) { throw new utilAPI.GlacierAPIError("The sessionToken is invalid"); }

        return (await Promise.all(doc.friends.map(async (userID) => {
            const doc = await model.Result.findOne({ id: themeLoader.themes[id].id, userID: userID, userProvider: "twitter" }).exec();
            if (!doc) { return null; }
            return {
                answer: doc.answer,
                name: doc.name,
                imageURI: doc.imageURI
            };
        }))).filter(<T>(x: T): x is Exclude<T, null> => { return x != null; });
    } catch (e) {
        throw e;
    }
}

export async function putVote(id: number, sessionToken: string, answer: number) {
    if (themeLoader.themes[id] == undefined) { throw new utilAPI.GlacierAPIError("The id is invalid"); }
    if (themeLoader.themes[id].choices[answer] == undefined) {
        throw new utilAPI.GlacierAPIError("The answer is invalid");
    }

    const doc = await model.User.findOne({ sessionToken: sessionToken }).exec();
    if (!doc) { throw new utilAPI.GlacierAPIError("The sessionToken is invalid"); }

    try {
        await model.Result.updateOne({ id: themeLoader.themes[id].id, userID: doc.userID, userProvider: doc.userProvider },
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

export async function getComments(id: number) {
    if (themeLoader.themes[id] == undefined) { throw new utilAPI.GlacierAPIError("The id is invalid"); }

    try {
        return (await model.Comment.find({ id: themeLoader.themes[id].id }).exec()).
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

export async function postComment(id: number, sessionToken: string, message: string) {
    if (themeLoader.themes[id] == undefined) { throw new utilAPI.GlacierAPIError("The id is invalid"); }

    try {
        const doc = await model.User.findOne({ sessionToken: sessionToken }).exec();
        if (!doc) { throw new utilAPI.GlacierAPIError("The sessionToken is invalid"); }

        await new model.Comment({
            id: themeLoader.themes[id].id,
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
