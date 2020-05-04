import * as db from "../model";
import type { ThemeModel } from "../model";
import * as sessionAPI from "./session";

export async function exists(themeID: number): Promise<boolean> {
    const num = await db.Theme.countDocuments({ themeID, isEnabled: true }).exec();
    if (num != 1) { return false; }
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

export async function updateTheme(sessionToken: string,
    isEnabled: boolean, themeID: number, title: string,
    description: string, imageURI: string, genre: number,
    choices: string[], keywords: string[], DRClass: number): Promise<void> {
    const { userProvider, userID } = await sessionAPI.getMySession(sessionToken);

    await db.Theme.updateOne({
        themeID
    }, {
        $set: {
            userProvider, userID,
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
