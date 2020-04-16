import * as model from "../model";

function isInfluencer(numOfFollowers: number) {
    if (!process.env.NUM_OF_INFLUENCERS_FOLLOWER) {
        return false;
    }
    return numOfFollowers > parseInt(process.env.NUM_OF_INFLUENCERS_FOLLOWER);
}

export async function getMyProfile(sessionToken: string) {
    const session = await model.Session.findOne({ sessionToken: sessionToken }).exec();
    if (!session) { throw new Error("Invalid sessionToken"); }

    const profile = (await getProfiles([{
        userProvider: session.userProvider,
        userID: session.userID
    }]));
    if (profile.length == 0) { throw new Error("User not found"); }

    return profile[0];
}

export async function getProfiles(users: { userProvider: string, userID: string }[]) {
    const _users = await model.User.find({ $or: users }).exec();

    return Promise.all(_users.map(async user => {
        const votes = (await model.Vote.find({
            userProvider: user.userProvider,
            userID: user.userID,
            expiredAt: { $exists: false }
        }).exec())
            .map(vote => ({
                themeID: vote.themeID,
                answer: vote.answer,
                userProvider: vote.userProvider,
                userID: vote.userID,
                createdAt: vote.createdAt
            }))
            .sort((a, b) => a.themeID - b.themeID);

        const comments = (await model.Comment.find({
            userProvider: user.userProvider,
            userID: user.userID,
            expiredAt: { $exists: false }
        }).exec())
            .map(comment => ({
                themeID: comment.themeID,
                answer: comment.message,
                userProvider: comment.userProvider,
                userID: comment.userID,
                createdAt: comment.createdAt
            }))
            .sort((a, b) => a.themeID - b.themeID);

        return {
            userProvider: user.userProvider,
            userID: user.userID,
            name: user.name,
            imageURI: user.imageURI,
            isInfluencer: isInfluencer(user.numOfFollowers),
            votes: votes,
            comments: comments
        };
    }));
}
