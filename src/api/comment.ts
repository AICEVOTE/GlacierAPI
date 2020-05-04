import XSSFilters from "xss-filters";
import * as db from "../model";
import type { CommentModel } from "../model";
import * as firebaseAPI from "./firebase";
import * as sessionAPI from "./session";
import * as themeAPI from "./theme";

export async function getComments(themeID?: number, users?: {
    userProvider: string;
    userID: string;
}[]): Promise<CommentModel[]> {
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

export async function comment(themeID: number, sessionToken: string, message: string): Promise<void> {
    if ((await themeAPI.exists(themeID)) == false) {
        throw new Error("Invalid themeID");
    }

    const { userProvider, userID } = await sessionAPI.getMySession(sessionToken);
    message = XSSFilters.inHTMLData(message);
    await firebaseAPI.sendNotification(userProvider, userID, message);

    await new db.Comment({
        themeID, message,
        userProvider, userID,
        createdAt: Date.now()
    }).save();
}
