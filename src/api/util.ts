import * as db from "../model";
import themeLoader from "./theme";

export async function calcTopicality(themeID: number) {
    if (!themeLoader.exists(themeID)) {
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

export function isString(obj: unknown | null | undefined): obj is string {
    if (obj == null || obj == undefined) { return false; }
    return typeof obj == "string";
}

export function isNumber(obj: unknown | null | undefined): obj is number {
    if (obj == null || obj == undefined) { return false; }
    return typeof obj == "number";
}

export function isArray(obj: unknown | null | undefined): obj is any[] {
    if (obj == null || obj == undefined) { return false; }
    return Object.prototype.toString.call(obj) == "[object Array]";
}
