import * as db from "../model";
import * as commentAPI from "./comment";
import * as voteAPI from "./vote";

if (!process.env.NUM_OF_INFLUENCERS_FOLLOWER) {
    throw new Error("NUM_OF_INFLUENCERS_FOLLOWER not configured");
}
const numOfInfuencersFollower = parseInt(process.env.NUM_OF_INFLUENCERS_FOLLOWER);

function isInfluencer(numOfFollowers: number) {
    return numOfFollowers > numOfInfuencersFollower;
}

export async function getInfluencers() {
    return await db.User.find({
        numOfFollowers: { $gt: numOfInfuencersFollower }
    }).exec();
}

// Get user infomation from session token
export async function getMe(sessionToken: string) {
    const session = await db.Session.findOne({ sessionToken: sessionToken }).exec();
    if (!session) { throw new Error("Invalid sessionToken"); }

    const user = await db.User.findOne({
        userProvider: session.userProvider,
        userID: session.userID
    }).exec();
    if (!user) { throw new Error("User not found"); }
    return user;
}

export async function getProfile(userProvider: string, userID: string) {
    const user = await db.User.findOne({
        userProvider: userProvider,
        userID: userID
    });
    if (!user) { return undefined; }

    const votes = await voteAPI.getVotes(undefined, [{
        userProvider: userProvider,
        userID: userID
    }]);
    const comments = await commentAPI.getComments(undefined, [{
        userProvider: userProvider,
        userID: userID
    }]);

    return {
        userProvider: userProvider,
        userID: userID,
        name: user.name,
        imageURI: user.imageURI,
        isInfluencer: isInfluencer(user.numOfFollowers),
        votes: votes.sort((a, b) => a.themeID - b.themeID),
        comments: comments.sort((a, b) => a.themeID - b.themeID)
    };
}
