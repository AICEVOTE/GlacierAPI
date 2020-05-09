import * as db from "../model";
import type { UserModel } from "../model";

export interface UserIdentifier {
    userProvider: string;
    userID: string;
}

const numOfInfuencersFollower = process.env.NUM_OF_INFLUENCERS_FOLLOWER
    ? parseInt(process.env.NUM_OF_INFLUENCERS_FOLLOWER)
    : 10000;

export function isInfluencer(numOfFollowers: number): boolean {
    return numOfFollowers > numOfInfuencersFollower;
}

export async function getInfluencers(): Promise<UserModel[]> {
    return await db.User.find({
        numOfFollowers: { $gte: numOfInfuencersFollower }
    }).exec();
}

export async function getFriends({ userProvider, userID }: UserIdentifier): Promise<UserIdentifier[]> {
    const user = await db.User.findOne({ userProvider, userID }).exec();
    if (!user) { throw new Error("User not found"); }
    return user.friends.map(userID => ({
        userProvider: "twitter",
        userID
    }));
}

export async function getUser({ userProvider, userID }: UserIdentifier): Promise<UserModel> {
    const user = await db.User.findOne({ userProvider, userID });
    if (!user) { throw new Error("User not found"); }
    return user;
}
