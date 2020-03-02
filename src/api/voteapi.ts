import themeLoader from "./theme";
import * as model from "../model";
import * as utilAPI from "../api/utilapi";
import XSSFilters from "xss-filters";

declare const answerType: model.IAnswerType<never>;
function isCompatibleAnswer(id: number, answer: number) {
    return Number.isInteger(answer) && answer >= 0 && answer < answerType.length &&
        themeLoader.themes[id].choices[answer] != "";
}

function isInfluencer(numOfFollowers: number) {
    return Number.isInteger(numOfFollowers) && numOfFollowers > 50000;
}

export function getResult(id: number) {
    if (!utilAPI.isCompatibleId(id)) { throw new utilAPI.GlacierAPIError("The id is invalid"); }
    return {
        id: id,
        results: themeLoader.themes[id].realtimeResult,
        counts: themeLoader.themes[id].realtimeCount
    }
}

export async function getVotes(id: number, sessionID: string) {
    if (!utilAPI.isCompatibleId(id)) { throw new utilAPI.GlacierAPIError("The id is invalid"); }

    try {
        const doc = await model.User.findOne({ sessionID: sessionID }).exec();
        if (!doc) { throw new utilAPI.GlacierAPIError("The sessionID is invalid"); }

        const votes = (await Promise.all(doc.friends.map(async (userID) => {
            const doc = await model.Result.findOne({ id: themeLoader.themes[id].id, userID: userID }).exec();
            if (!doc) { return null; }
            return {
                answer: doc.answer,
                name: doc.name,
                imageURI: doc.imageURI
            }
        }))).filter(<T>(x: T): x is Exclude<T, null> => { return x != null; });

        const votesFromInfluencer = (await model.Result.find({ id: themeLoader.themes[id].id, isInfluencer: true }).exec()).
            map((doc) => {
                return {
                    answer: doc.answer,
                    name: doc.name,
                    imageURI: doc.imageURI
                }
            });

        return {
            id: id,
            votes: votes,
            votesFromInfluencer: votesFromInfluencer
        };
    } catch (e) {
        throw e;
    }
}

export async function putVote(id: number, sessionID: string, answer: number) {
    if (!utilAPI.isCompatibleId(id)) { throw new utilAPI.GlacierAPIError("The id is invalid"); }
    if (!isCompatibleAnswer(id, answer)) { throw new utilAPI.GlacierAPIError("The answer is invalid"); }

    const doc = await model.User.findOne({ sessionID: sessionID }).exec();
    if (!doc) { throw new utilAPI.GlacierAPIError("The sessionID is invalid"); }

    try {
        await model.Result.updateOne({ id: themeLoader.themes[id].id, userID: doc.userID, userProvider: doc.userProvider },
            {
                $set: {
                    answer: answer, name: doc.name,
                    isInfluencer: isInfluencer(doc.numOfFollowers),
                    imageURI: doc.imageURI, createdAt: Date.now()
                }
            }, { upsert: true }).exec();
    } catch (e) {
        throw e;
    }
}

export function getTransition(id: number) {
    if (!utilAPI.isCompatibleId(id)) { throw new utilAPI.GlacierAPIError("The id is invalid"); }
    return {
        id: id,
        shortTransition: themeLoader.themes[id].shortTransition,
        longTransition: themeLoader.themes[id].longTransition
    };
}

export async function getComments(id: number) {
    if (!utilAPI.isCompatibleId(id)) { throw new utilAPI.GlacierAPIError("The id is invalid"); }

    try {
        const comments = (await model.Comment.find({ id: themeLoader.themes[id].id }).exec()).
            map((doc) => {
                return {
                    message: doc.message,
                    createdAt: doc.createdAt,
                    name: doc.name,
                    imageURI: doc.imageURI,
                    isInfluencer: doc.isInfluencer
                }
            });
        return {
            id: id,
            comments: comments
        };
    } catch (e) {
        throw e;
    }
}

export async function postComment(id: number, sessionID: string, message: string) {
    if (!utilAPI.isCompatibleId(id)) { throw new utilAPI.GlacierAPIError("The id is invalid"); }

    try {
        const doc = await model.User.findOne({ sessionID: sessionID }).exec();
        if (!doc) { throw new utilAPI.GlacierAPIError("The sessionID is invalid"); }

        await new model.Comment({
            id: themeLoader.themes[id].id,
            message: XSSFilters.inHTMLData(message),
            createdAt: Date.now() + 1000 * 60 * 60 * 9,
            name: doc.name,
            imageURI: doc.imageURI,
            isInfluencer: isInfluencer(doc.numOfFollowers)
        }).save();
    } catch (e) {
        throw e;
    }
}
