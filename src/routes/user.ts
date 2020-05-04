import express from "express";
import createError from "http-errors";
import * as commentAPI from "../api/comment";
import * as sessionAPI from "../api/session";
import * as userAPI from "../api/user";
import * as utilAPI from "../api/util";
import * as voteAPI from "../api/vote";
import type { CommentModel, VoteModel } from "../model";
const router = express.Router();


async function getProfile(userProvider: string, userID: string): Promise<{
    userProvider: string;
    userID: string;
    name: string;
    imageURI: string;
    isInfluencer: boolean;
    votes: VoteModel[];
    comments: CommentModel[];
} | undefined> {
    try {
        const user = await userAPI.getUser(userProvider, userID);
        const votes = await voteAPI.getVotes(undefined, [{
            userProvider: user.userProvider,
            userID: user.userID
        }]);
        const comments = await commentAPI.getComments(undefined, [{
            userProvider: user.userProvider,
            userID: user.userID
        }]);
        return {
            userProvider: user.userProvider,
            userID: user.userID,
            name: user.name,
            imageURI: user.imageURI,
            isInfluencer: userAPI.isInfluencer(user.numOfFollowers),
            votes: votes.sort((a, b) => a.themeID - b.themeID),
            comments: comments.sort((a, b) => a.themeID - b.themeID)
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
        const { userProvider, userID } = await sessionAPI.getMySession(sessionToken);
        res.json(await getProfile(userProvider, userID));
    } catch (e) {
        next(createError(401));
    }
});

router.post("/profiles", async (req, res, next) => {
    const query = req.body;
    if (!utilAPI.isUserlist(query)) {
        next(createError(400));
        return;
    }

    const profiles = (await Promise
        .all(query.map(async user =>
            getProfile(user.userProvider, user.userID)
        )))
        .filter(<T>(x: T): x is Exclude<T, undefined> => x != undefined);
    res.json(profiles);
});

export default router;
