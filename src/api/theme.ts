import XSSFilters from "xss-filters";
import * as db from "../model";
import type { ThemeModel } from "../model";
import * as firebaseAPI from "./firebase";
import * as sessionAPI from "./session";
import * as userAPI from "./user";
import type { UserIdentifier } from "./user";

export async function exists(themeID: number): Promise<boolean> {
    const theme = await db.Theme.findOne({ themeID, isEnabled: true }).exec();
    if (!theme) { return false; }
    return true;
}

export async function getTheme(themeID: number): Promise<ThemeModel> {
    const theme = await db.Theme.findOne({ themeID, isEnabled: true }).exec();
    if (!theme) { throw new Error("Invalid themeID"); }
    return theme;
}

export async function getAllThemes(): Promise<ThemeModel[]> {
    return await db.Theme.find({ isEnabled: true }).exec();
}

export async function getThemesByUser({ userProvider, userID }: UserIdentifier): Promise<ThemeModel[]> {
    return await db.Theme.find({ isEnabled: true, userProvider, userID }).exec();
}

export async function getThemesByRegex(q: string): Promise<ThemeModel[]> {
    return await db.Theme.find({ isEnabled: true, description: { $regex: q } }).exec();
}

export async function updateTheme(sessionToken: string, isEnabled: boolean,
    themeID: number, title: string, description: string, imageURI: string,
    genre: number, choices: string[], DRClass: number): Promise<void> {

    const { userProvider, userID } = await sessionAPI.getMySession({ sessionToken });

    if ([1, 2, 3, 4, 5].find(val => val == DRClass) == undefined) {
        throw new Error("Invalid DRClass");
    }

    if (isNaN(themeID) || isNaN(genre)) {
        throw new Error("NaN is not allowed");
    }

    const theme = await db.Theme.findOne({ themeID }).exec();
    if (theme && (theme.userProvider != userProvider || theme.userID != userID)) {
        throw new Error("The specified themeID is already in use");
    }

    title = XSSFilters.inHTMLData(title);
    description = XSSFilters.inHTMLData(description);
    imageURI = XSSFilters.inHTMLData(imageURI);
    choices = choices.map(choice => XSSFilters.inHTMLData(choice));

    await db.Theme.updateOne({
        themeID, userProvider, userID
    }, {
        $set: {
            isEnabled, title, description,
            imageURI, genre,
            choices, keywords: [],
            DRClass
        }
    }, { upsert: true });

    const user = await userAPI.getUser({ userProvider, userID });
    await firebaseAPI.sendUserNotification(user, `@${user.name} updated a theme`, title);
}

export async function calcTopicality(themeID: number): Promise<number> {
    if (await exists(themeID) == false) {
        throw new Error("Invalid themeID");
    }

    const startsAt = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const votes = await db.Vote.find({
        themeID, createdAt: { $gt: startsAt }
    }).countDocuments().exec();
    const comments = await db.Comment.find({
        themeID, createdAt: { $gt: startsAt }
    }).countDocuments().exec();

    return votes + comments;
}
