import * as db from "../model";
import type { ThemeModel } from "../model";
import * as userAPI from "./user";

export async function exists(themeID: number): Promise<boolean> {
    const theme = await db.Theme.findOne({ themeID }).exec();
    if (!theme || theme.isEnabled == false) {
        return false;
    }
    return true;
}

export async function getTheme(themeID: number): Promise<ThemeModel> {
    const theme = await db.Theme.findOne({ themeID }).exec();
    if (!theme || theme.isEnabled == false) {
        throw new Error("Invalid themeID");
    }
    return theme;
}

export async function getAllThemes(): Promise<ThemeModel[]> {
    const themes = await db.Theme.find({}).exec();
    return themes.filter(theme => theme.isEnabled);
}

export async function updateTheme(sessionToken: string,
    isEnabled: boolean, themeID: number, title: string,
    description: string, imageURI: string, genre: number,
    choices: string[], keywords: string[], DRClass: number): Promise<void> {
    const me = await userAPI.getMe(sessionToken);

    await db.Theme.updateOne({
        themeID
    }, {
        $set: {
            userProvider: me.userProvider,
            userID: me.userID,
            isEnabled, title, description,
            imageURI, genre, choices,
            keywords, DRClass
        }
    }, { upsert: true });
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
