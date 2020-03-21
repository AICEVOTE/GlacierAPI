import * as model from "../model";

function isInfluencer(numOfFollowers: number) {
    if (!process.env.NUM_OF_INFLUENCERS_FOLLOWER) {
        return false;
    }
    return numOfFollowers > parseInt(process.env.NUM_OF_INFLUENCERS_FOLLOWER);
}

export async function getMyProfile(sessionToken: string) {
    try {
        const doc = await model.Session.findOne({ sessionToken: sessionToken }).exec();
        if (!doc) { throw new Error("Invalid sessionToken"); }

        const profile = (await getProfiles([{
            userProvider: doc.userProvider,
            userID: doc.userID
        }]));
        if (profile.length == 0) { throw new Error("User not found"); }

        return profile[0];
    } catch (e) {
        throw e;
    }
}

export async function getProfiles(users: { userProvider: string, userID: string }[]) {
    try {
        const docs = await model.User.find({ $or: users }).exec();

        return Promise.all(docs.map(async doc => {
            const votes = (await model.Vote.find({
                userProvider: doc.userProvider,
                userID: doc.userID,
                expiredAt: { $exists: false }
            }).exec()).map(doc => ({
                themeID: doc.themeID,
                answer: doc.answer,
                userProvider: doc.userProvider,
                userID: doc.userID,
                createdAt: doc.createdAt
            })).sort((a, b) => a.themeID - b.themeID);

            const comments = (await model.Comment.find({
                userProvider: doc.userProvider,
                userID: doc.userID,
                expiredAt: { $exists: false }
            }).exec()).map(doc => ({
                themeID: doc.themeID,
                answer: doc.message,
                userProvider: doc.userProvider,
                userID: doc.userID,
                createdAt: doc.createdAt
            })).sort((a, b) => a.themeID - b.themeID);

            return {
                userProvider: doc.userProvider,
                userID: doc.userID,
                name: doc.name,
                imageURI: doc.imageURI,
                isInfluencer: isInfluencer(doc.numOfFollowers),
                votes: votes,
                comments: comments
            };
        }));
    } catch (e) {
        throw e;
    }
}
