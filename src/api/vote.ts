import * as db from "../model";
import type { VoteModel } from "../model";
import * as themeAPI from "./theme";
import * as userAPI from "./user";

export async function getVotes(themeID?: number, users?: {
    userProvider: string;
    userID: string;
}[]): Promise<VoteModel[]> {
    if (themeID != undefined
        && await themeAPI.exists(themeID) == false) {
        throw new Error("Invalid themeID");
    }

    if (users != undefined && users.length == 0) {
        return [];
    }

    const query = themeID != undefined
        ? users
            ? { themeID, $or: users, expiredAt: { $exists: false } }
            : { themeID, expiredAt: { $exists: false } }
        : users
            ? { $or: users, expiredAt: { $exists: false } }
            : { expiredAt: { $exists: false } };

    return await db.Vote.find(query).exec();
}

export async function vote(themeID: number, sessionToken: string, answer: number): Promise<void> {
    const theme = await themeAPI.getTheme(themeID);
    if (theme.choices[answer] == undefined) {
        throw new Error("Invalid answer");
    }

    const user = await userAPI.getMe(sessionToken);
    const now = Date.now();

    await db.Vote.updateOne({
        themeID,
        userID: user.userID,
        userProvider: user.userProvider,
        expiredAt: { $exists: false }
    }, { $set: { expiredAt: now } }).exec();

    await new db.Vote({
        themeID,
        userID: user.userID,
        userProvider: user.userProvider,
        answer,
        createdAt: now
    }).save();
}
