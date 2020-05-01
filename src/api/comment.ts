import XSSFilters from "xss-filters";
import * as model from "../model";
import themeLoader from "./theme";
import * as userAPI from "./user";

export async function getComments(themeID?: number, users?: { userProvider: string, userID: string }[]) {
    if (themeID != undefined && !themeLoader.exists(themeID)) {
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

    return await model.Comment.find(query).exec();
}

export async function postComment(themeID: number, sessionToken: string, message: string) {
    if (!themeLoader.exists(themeID)) {
        throw new Error("Invalid themeID");
    }

    const user = await userAPI.getMe(sessionToken);
    await new model.Comment({
        themeID: themeID,
        message: XSSFilters.inHTMLData(message),
        userProvider: user.userProvider,
        userID: user.userID,
        createdAt: Date.now()
    }).save();
}
