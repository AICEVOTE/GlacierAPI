import * as db from "../model";
import type { UserModel } from "../model";
import * as commentAPI from "./comment";
import * as voteAPI from "./vote";

const numOfInfuencersFollower = process.env.NUM_OF_INFLUENCERS_FOLLOWER
    ? parseInt(process.env.NUM_OF_INFLUENCERS_FOLLOWER)
    : 10000;

function isInfluencer(numOfFollowers: number) {
    return numOfFollowers > numOfInfuencersFollower;
}

export async function getInfluencers(): Promise<UserModel[]> {
    return await db.User.find({
        numOfFollowers: { $gt: numOfInfuencersFollower }
    }).exec();
}

// Get user infomation from session token
export async function getMe(sessionToken: string): Promise<UserModel> {
    const session = await db.Session.findOne({ sessionToken: sessionToken }).exec();
    if (!session) { throw new Error("Invalid sessionToken"); }

    const user = await db.User.findOne({
        userProvider: session.userProvider,
        userID: session.userID
    }).exec();
    if (!user) { throw new Error("User not found"); }
    return user;
}

export async function getProfile(userProvider: string, userID: string): Promise<{
    userProvider: string;
    userID: string;
    name: string;
    imageURI: string;
    isInfluencer: boolean;
    votes: db.VoteModel[];
    comments: db.CommentModel[];
} | undefined> {
    const user = await db.User.findOne({
        userProvider, userID
    });
    if (!user) { return undefined; }

    const votes = await voteAPI.getVotes(undefined, [{
        userProvider, userID
    }]);
    const comments = await commentAPI.getComments(undefined, [{
        userProvider, userID
    }]);

    return {
        userProvider, userID,
        name: user.name,
        imageURI: user.imageURI,
        isInfluencer: isInfluencer(user.numOfFollowers),
        votes: votes.sort((a, b) => a.themeID - b.themeID),
        comments: comments.sort((a, b) => a.themeID - b.themeID)
    };
}
