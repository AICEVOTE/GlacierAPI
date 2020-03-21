import themeLoader from "./theme";
import * as model from "../model";
import XSSFilters from "xss-filters";

async function getVotes(themeID: number, users: { userProvider: string, userID: string }[]) {
    if (themeLoader.themes[themeID] == undefined) {
        throw new Error("Invalid themeID");
    }

    return (await model.Vote.find({
        themeID: themeLoader.themes[themeID].themeID,
        $or: users,
        expiredAt: { $exists: false }
    }).exec()).
        map((doc) => ({
            themeID: doc.themeID,
            answer: doc.answer,
            userProvider: doc.userProvider,
            userID: doc.userID,
            createdAt: doc.createdAt
        }));
}

export async function getInfluencerVotes(themeID: number) {
    if (!process.env.NUM_OF_INFLUENCERS_FOLLOWER) {
        throw new Error("NUM_OF_INFLUENCERS_FOLLOWER not configured");
    }

    try {
        const influencers = (await model.User.find({
            numOfFollowers: { $gt: parseInt(process.env.NUM_OF_INFLUENCERS_FOLLOWER) }
        }).exec()).map(user => ({ userProvider: user.userProvider, userID: user.userID }));

        if (influencers.length == 0) { return []; }

        return await getVotes(themeID, influencers);
    } catch (e) {
        throw e;
    }
}

export async function getFriendVotes(themeID: number, sessionToken: string) {
    if (themeLoader.themes[themeID] == undefined) { throw new Error("Invalid themeID"); }

    try {
        const session = await model.Session.findOne({ sessionToken: sessionToken }).exec();
        if (!session) { throw new Error("Invalid sessionToken"); }

        const user = await model.User.findOne({
            userProvider: session.userProvider,
            userID: session.userID
        }).exec();
        if (!user) { throw new Error("User not found"); }

        return await getVotes(themeID, user.friends.map(userID => ({
            userProvider: "twitter",
            userID: userID
        })));
    } catch (e) {
        throw e;
    }
}

export async function putVote(themeID: number, sessionToken: string, answer: number) {
    if (themeLoader.themes[themeID] == undefined) { throw new Error("Invalid themeID"); }
    if (themeLoader.themes[themeID].choices[answer] == undefined) {
        throw new Error("Invalid answer");
    }

    const doc = await model.Session.findOne({ sessionToken: sessionToken }).exec();
    if (!doc) { throw new Error("Invalid sessionToken"); }

    try {
        const now = Date.now();

        await model.Vote.updateOne({
            themeID: themeLoader.themes[themeID].themeID,
            userID: doc.userID,
            userProvider: doc.userProvider,
            expiredAt: { $exists: false }
        }, { $set: { expiredAt: now } }).exec();

        await new model.Vote({
            themeID: themeLoader.themes[themeID].themeID,
            userID: doc.userID,
            userProvider: doc.userProvider,
            answer: answer,
            createdAt: now
        }).save();
    } catch (e) {
        throw e;
    }
}

export async function getComments(themeID: number) {
    if (themeLoader.themes[themeID] == undefined) { throw new Error("Invalid themeID"); }

    try {
        return (await model.Comment.find({ themeID: themeLoader.themes[themeID].themeID }).exec()).
            map((doc) => ({
                themeID: doc.themeID,
                message: doc.message,
                userProvider: doc.userProvider,
                userID: doc.userID,
                createdAt: doc.createdAt
            }));
    } catch (e) {
        throw e;
    }
}

export async function postComment(themeID: number, sessionToken: string, message: string) {
    if (themeLoader.themes[themeID] == undefined) { throw new Error("Invalid themeID"); }

    try {
        const doc = await model.Session.findOne({ sessionToken: sessionToken }).exec();
        if (!doc) { throw new Error("Invalid sessionToken"); }

        await new model.Comment({
            themeID: themeLoader.themes[themeID].themeID,
            message: XSSFilters.inHTMLData(message),
            userProvider: doc.userProvider,
            userID: doc.userID,
            createdAt: Date.now()
        }).save();
    } catch (e) {
        throw e;
    }
}
