import express from "express";
import createError from "http-errors";
import * as commentAPI from "../api/comment";
import * as sessionAPI from "../api/session";
import * as themeAPI from "../api/theme";
import * as userAPI from "../api/user";
import type { UserIdentifier } from "../api/user";
import * as utilAPI from "../api/util";
import * as voteAPI from "../api/vote";
import type { CommentModel, ThemeModel, VoteModel } from "../model";
const router = express.Router();


async function getProfile({ userProvider, userID }: UserIdentifier): Promise<{
    userProvider: string;
    userID: string;
    name: string;
    imageURI: string;
    isInfluencer: boolean;
    votes: VoteModel[];
    comments: CommentModel[];
    themes: ThemeModel[]
} | undefined> {
    try {
        const user = await userAPI.getUser({ userProvider, userID });

        const votes = (await voteAPI.getVotes(undefined, [{ userProvider, userID }]))
            .sort((a, b) => a.themeID - b.themeID);

        const comments = (await commentAPI.getComments(undefined, [{ userProvider, userID }]))
            .sort((a, b) => a.themeID - b.themeID);

        const themes = await themeAPI.getThemesByUser({ userProvider, userID });

        return {
            ...user, votes, comments, themes,
            isInfluencer: userAPI.isInfluencer(user.numOfFollowers)
        }
    } catch (e) {
        return undefined;
    }
}

router.get("/profiles", async (req, res, next) => {
    const sessionToken: unknown = req.query.sessiontoken;

    if (!utilAPI.isString(sessionToken)) {
        return next(createError(400));
    }

    try {
        const user = await sessionAPI.getMySession({ sessionToken });
        res.json(await getProfile({
            userProvider: user.userProvider,
            userID: user.userID
        }));
    } catch (e) {
        next(createError(401));
    }
});

router.post("/profiles", async (req, res, next) => {
    const query = req.body;
    if (!utilAPI.isUserlist(query)) {
        return next(createError(400));
    }

    const profiles = (await Promise
        .all(query.map(async user => getProfile(user))))
        .filter(<T>(x: T): x is Exclude<T, undefined> => x != undefined);
    res.json(profiles);
});

export default router;
