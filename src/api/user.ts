import * as model from "../model";
import * as voteAPI from "./vote";

function isInfluencer(numOfFollowers: number) {
    if (!process.env.NUM_OF_INFLUENCERS_FOLLOWER) {
        throw new Error("NUM_OF_INFLUENCERS_FOLLOWER not configured");
    }
    return numOfFollowers > parseInt(process.env.NUM_OF_INFLUENCERS_FOLLOWER);
}

async function getProfile(userProvider: string, userID: string) {
    const user = await model.User.findOne({
        userProvider: userProvider,
        userID: userID
    });
    if (!user) { return undefined; }

    const votes = await voteAPI.getVotes(undefined, [{
        userProvider: userProvider,
        userID: userID
    }]);
    const comments = await voteAPI.getComments(undefined, [{
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

export async function getMyProfile(sessionToken: string) {
    const session = await model.Session.findOne({ sessionToken: sessionToken }).exec();
    if (!session) { throw new Error("Invalid sessionToken"); }

    const profile = await getProfile(session.userProvider, session.userID);
    if (!profile) { throw new Error("User not found"); }
    return profile;
}

export async function getProfiles(users: { userProvider: string, userID: string }[]) {
    return (await Promise
        .all(users.map(user => getProfile(user.userProvider, user.userID))))
        .filter(<T>(x: T): x is Exclude<T, undefined> => x != undefined);
}
