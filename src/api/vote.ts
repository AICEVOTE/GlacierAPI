import themeLoader from "./theme";
import * as model from "../model";
import XSSFilters from "xss-filters";

// Get user infomation from session token
async function getUser(sessionToken: string) {
    const session = await model.Session.findOne({ sessionToken: sessionToken }).exec();
    if (!session) { throw new Error("Invalid sessionToken"); }

    const user = await model.User.findOne({
        userProvider: session.userProvider,
        userID: session.userID
    }).exec();
    if (!user) { throw new Error("User not found"); }
    return user;
}

export async function getVotes(themeID?: number, users?: { userProvider: string, userID: string }[]) {
    if (themeID && !themeLoader.exists(themeID)) {
        throw new Error("Invalid themeID");
    }

    const query = themeID
        ? users
            ? { themeID: themeID, $or: users, expiredAt: { $exists: false } }
            : { themeID: themeID, expiredAt: { $exists: false } }
        : users
            ? { $or: users, expiredAt: { $exists: false } }
            : { expiredAt: { $exists: false } };

    return await model.Vote.find(query).exec();
}

export async function getComments(themeID?: number, users?: { userProvider: string, userID: string }[]) {
    if (themeID && !themeLoader.exists(themeID)) {
        throw new Error("Invalid themeID");
    }

    const query = themeID
        ? users
            ? { themeID: themeID, $or: users }
            : { themeID: themeID }
        : users
            ? { $or: users }
            : {};

    return await model.Comment.find(query).exec();
}

async function getInfluencers() {
    if (!process.env.NUM_OF_INFLUENCERS_FOLLOWER) {
        throw new Error("NUM_OF_INFLUENCERS_FOLLOWER not configured");
    }
    const numOfInfuencersFollower = parseInt(process.env.NUM_OF_INFLUENCERS_FOLLOWER);
    return await model.User.find({
        numOfFollowers: { $gt: numOfInfuencersFollower }
    }).exec();
}

export async function getInfluencerVotes(themeID: number) {
    const influencers = await getInfluencers();
    if (influencers.length == 0) { return []; }
    return await getVotes(themeID, influencers);
}

export async function getFriendVotes(themeID: number, sessionToken: string) {
    const user = await getUser(sessionToken);
    return await getVotes(themeID, user.friends.map(userID => ({
        userProvider: "twitter",
        userID: userID
    })));
}

export async function putVote(themeID: number, sessionToken: string, answer: number) {
    const theme = themeLoader.theme(themeID);
    if (theme.choices[answer] == undefined) {
        throw new Error("Invalid answer");
    }

    const user = await getUser(sessionToken);
    const now = Date.now();

    await model.Vote.updateOne({
        themeID: themeID,
        userID: user.userID,
        userProvider: user.userProvider,
        expiredAt: { $exists: false }
    }, { $set: { expiredAt: now } }).exec();

    await new model.Vote({
        themeID: themeID,
        userID: user.userID,
        userProvider: user.userProvider,
        answer: answer,
        createdAt: now
    }).save();
}

export async function postComment(themeID: number, sessionToken: string, message: string) {
    if (!themeLoader.exists(themeID)) {
        throw new Error("Invalid themeID");
    }

    const user = await getUser(sessionToken);
    await new model.Comment({
        themeID: themeID,
        message: XSSFilters.inHTMLData(message),
        userProvider: user.userProvider,
        userID: user.userID,
        createdAt: Date.now()
    }).save();
}
