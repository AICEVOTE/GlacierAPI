import XSSFilters from "xss-filters";
import * as db from "../model";
import * as firebaseAPI from "./firebase";
import * as themeAPI from "./theme";
import * as userAPI from "./user";

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
            ? { themeID, $or: users }
            : { themeID }
        : users
            ? { $or: users }
            : {};

    return await db.Comment.find(query).exec();
}

export async function comment(themeID: number, sessionToken: string, message: string) {
    if ((await themeAPI.exists(themeID)) == false) {
        throw new Error("Invalid themeID");
    }

    const user = await userAPI.getMe(sessionToken);
    message = XSSFilters.inHTMLData(message);
    await firebaseAPI.sendNotification(
        user.userProvider, user.userID, message);

    await new db.Comment({
        themeID, message,
        userProvider: user.userProvider,
        userID: user.userID,
        createdAt: Date.now()
    }).save();
}
