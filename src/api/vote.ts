import * as model from "../model";
import themeLoader from "./theme";
import * as userAPI from "./user";

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

export async function putVote(themeID: number, sessionToken: string, answer: number) {
    const theme = themeLoader.theme(themeID);
    if (theme.choices[answer] == undefined) {
        throw new Error("Invalid answer");
    }

    const user = await userAPI.getMe(sessionToken);
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
