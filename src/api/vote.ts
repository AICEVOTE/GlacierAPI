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
    }).exec())
        .map(vote => ({
            themeID: vote.themeID,
            answer: vote.answer,
            userProvider: vote.userProvider,
            userID: vote.userID,
            createdAt: vote.createdAt
        }));
}

export async function getInfluencerVotes(themeID: number) {
    if (!process.env.NUM_OF_INFLUENCERS_FOLLOWER) {
        throw new Error("NUM_OF_INFLUENCERS_FOLLOWER not configured");
    }

    const influencers = (await model.User.find({
        numOfFollowers: { $gt: parseInt(process.env.NUM_OF_INFLUENCERS_FOLLOWER) }
    }).exec())
        .map(user => ({ userProvider: user.userProvider, userID: user.userID }));

    if (influencers.length == 0) { return []; }

    return await getVotes(themeID, influencers);
}

export async function getFriendVotes(themeID: number, sessionToken: string) {
    if (themeLoader.themes[themeID] == undefined) { throw new Error("Invalid themeID"); }

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
}

export async function putVote(themeID: number, sessionToken: string, answer: number) {
    if (themeLoader.themes[themeID] == undefined) { throw new Error("Invalid themeID"); }
    if (themeLoader.themes[themeID].choices[answer] == undefined) {
        throw new Error("Invalid answer");
    }

    const session = await model.Session.findOne({ sessionToken: sessionToken }).exec();
    if (!session) { throw new Error("Invalid sessionToken"); }

    const now = Date.now();

    await model.Vote.updateOne({
        themeID: themeLoader.themes[themeID].themeID,
        userID: session.userID,
        userProvider: session.userProvider,
        expiredAt: { $exists: false }
    }, { $set: { expiredAt: now } }).exec();

    await new model.Vote({
        themeID: themeLoader.themes[themeID].themeID,
        userID: session.userID,
        userProvider: session.userProvider,
        answer: answer,
        createdAt: now
    }).save();
}

export async function getComments(themeID: number) {
    if (themeLoader.themes[themeID] == undefined) { throw new Error("Invalid themeID"); }

    return (await model.Comment.find({ themeID: themeLoader.themes[themeID].themeID }).exec())
        .map(comment => ({
            themeID: comment.themeID,
            message: comment.message,
            userProvider: comment.userProvider,
            userID: comment.userID,
            createdAt: comment.createdAt
        }));
}

export async function postComment(themeID: number, sessionToken: string, message: string) {
    if (themeLoader.themes[themeID] == undefined) { throw new Error("Invalid themeID"); }

    const session = await model.Session.findOne({ sessionToken: sessionToken }).exec();
    if (!session) { throw new Error("Invalid sessionToken"); }

    await new model.Comment({
        themeID: themeLoader.themes[themeID].themeID,
        message: XSSFilters.inHTMLData(message),
        userProvider: session.userProvider,
        userID: session.userID,
        createdAt: Date.now()
    }).save();
}
