import * as db from "../model";
import type { UserModel } from "../model";

const numOfInfuencersFollower = process.env.NUM_OF_INFLUENCERS_FOLLOWER
    ? parseInt(process.env.NUM_OF_INFLUENCERS_FOLLOWER)
    : 10000;

export function isInfluencer(numOfFollowers: number) {
    return numOfFollowers > numOfInfuencersFollower;
}

export async function getInfluencers(): Promise<UserModel[]> {
    return await db.User.find({
        numOfFollowers: { $gt: numOfInfuencersFollower }
    }).exec();
}

export async function getUser(userProvider: string, userID: string): Promise<UserModel> {
    const user = await db.User.findOne({
        userProvider, userID
    });
    if (!user) { throw new Error("User not found"); }
    return user;
}
