import XSSFilters from "xss-filters";
import * as db from "../model";
import * as userAPI from "./user";
import * as themeAPI from "./theme";

export async function getComments(themeID?: number, users?: { userProvider: string, userID: string }[]) {
    if (themeID != undefined
        && (await themeAPI.exists(themeID)) == false) {
        throw new Error("Invalid themeID");
    }

    if (users != undefined && users.length == 0) {
        return [];
    }

    const query = themeID != undefined
        ? users
            ? { themeID: themeID, $or: users }
            : { themeID: themeID }
        : users
            ? { $or: users }
            : {};

    return await db.Comment.find(query).exec();
}

export async function postComment(themeID: number, sessionToken: string, message: string) {
    if ((await themeAPI.exists(themeID)) == false) {
        throw new Error("Invalid themeID");
    }

    const user = await userAPI.getMe(sessionToken);
    await new db.Comment({
        themeID: themeID,
        message: XSSFilters.inHTMLData(message),
        userProvider: user.userProvider,
        userID: user.userID,
        createdAt: Date.now()
    }).save();
}
