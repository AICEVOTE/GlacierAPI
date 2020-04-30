import themeLoader from "./theme";
import * as model from "../model";
import XSSFilters from "xss-filters";

// Get user infomation from session token
export async function getMe(sessionToken: string) {
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
    if (themeID != undefined && !themeLoader.exists(themeID)) {
        throw new Error("Invalid themeID");
    }

    if (users != undefined && users.length == 0) {
        return [];
    }

    const query = themeID != undefined
        ? users
            ? { themeID: themeID, $or: users, expiredAt: { $exists: false } }
            : { themeID: themeID, expiredAt: { $exists: false } }
        : users
            ? { $or: users, expiredAt: { $exists: false } }
            : { expiredAt: { $exists: false } };

    return await model.Vote.find(query).exec();
}

export async function getComments(themeID?: number, users?: { userProvider: string, userID: string }[]) {
    if (themeID != undefined && !themeLoader.exists(themeID)) {
        throw new Error("Invalid themeID");
    }

    if (users != undefined && users.length == 0) {
        return [];
    }

    const query = themeID != undefined
        ? users
            ? { themeID: themeID, $or: users }
            : { themeID: themeID }
        : users
            ? { $or: users }
            : {};

    return await model.Comment.find(query).exec();
}

export async function getInfluencers() {
    if (!process.env.NUM_OF_INFLUENCERS_FOLLOWER) {
        throw new Error("NUM_OF_INFLUENCERS_FOLLOWER not configured");
    }
    const numOfInfuencersFollower = parseInt(process.env.NUM_OF_INFLUENCERS_FOLLOWER);
    return await model.User.find({
        numOfFollowers: { $gt: numOfInfuencersFollower }
    }).exec();
}

export async function putVote(themeID: number, sessionToken: string, answer: number) {
    const theme = themeLoader.theme(themeID);
    if (theme.choices[answer] == undefined) {
        throw new Error("Invalid answer");
    }

    const user = await getMe(sessionToken);
    const now = Date.now();

    await model.Vote.update({
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

    const user = await getMe(sessionToken);
    await new model.Comment({
        themeID: themeID,
        message: XSSFilters.inHTMLData(message),
        userProvider: user.userProvider,
        userID: user.userID,
        createdAt: Date.now()
    }).save();
}
