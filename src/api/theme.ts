import * as db from "../model";
import type { ThemeModel } from "../model";

export async function exists(themeID: number): Promise<boolean> {
    try {
        const theme = await db.Theme.findOne({ themeID: themeID }).exec();
        return theme != null;
    } catch (e) {
        console.log(e);
        return false;
    }
}

export async function getTheme(themeID: number): Promise<ThemeModel> {
    const theme = await db.Theme.findOne({ themeID: themeID }).exec();
    if (!theme) {
        throw new Error("Invalid themeID");
    }
    return theme;
}

export async function getAllThemes(): Promise<ThemeModel[]> {
    return await db.Theme.find({}).exec();
}

export async function calcTopicality(themeID: number): Promise<number> {
    if (await exists(themeID) == false) {
        throw new Error("Invalid themeID");
    }

    const startsAt = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const votes = await db.Vote.find({
        themeID: themeID,
        createdAt: { $gt: startsAt }
    }).countDocuments().exec();
    const comments = await db.Comment.find({
        themeID: themeID,
        createdAt: { $gt: startsAt }
    }).countDocuments().exec();

    return votes + comments;
}
