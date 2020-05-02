import * as db from "../model";
import * as userAPI from "./user";
import * as themeAPI from "./theme";

export async function getVotes(themeID?: number, users?: { userProvider: string, userID: string }[]) {
    if (themeID != undefined
        && await themeAPI.exists(themeID) == false) {
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

    return await db.Vote.find(query).exec();
}

export async function putVote(themeID: number, sessionToken: string, answer: number) {
    const theme = await themeAPI.getTheme(themeID);
    if (theme.choices[answer] == undefined) {
        throw new Error("Invalid answer");
    }

    const user = await userAPI.getMe(sessionToken);
    const now = Date.now();

    await db.Vote.update({
        themeID: themeID,
        userID: user.userID,
        userProvider: user.userProvider,
        expiredAt: { $exists: false }
    }, { $set: { expiredAt: now } }).exec();

    await new db.Vote({
        themeID: themeID,
        userID: user.userID,
        userProvider: user.userProvider,
        answer: answer,
        createdAt: now
    }).save();
}
