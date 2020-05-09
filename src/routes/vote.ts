import express from "express";
import createError from "http-errors";
import * as commentAPI from "../api/comment";
import * as sessionAPI from "../api/session";
import * as userAPI from "../api/user";
import * as utilAPI from "../api/util";
import * as voteAPI from "../api/vote";
import { results, transitions } from "../computer";
const router = express.Router();


router.get("/results/:themeid", (req, res, next) => {
    const themeID = parseInt(req.params.themeid, 10);

    const result = results.find(result => result.themeID == themeID);
    if (!result) { return next(createError(404)); }

    res.json(result);
});

async function getFriends(sessionToken: string): Promise<{
    userProvider: string;
    userID: string;
}[]> {
    const user = await sessionAPI.getMySession({ sessionToken });
    return await userAPI.getFriends(user);
}

router.get("/votes/:themeid", async (req, res, next) => {
    const themeID = parseInt(req.params.themeid, 10);
    const sessionToken: unknown = req.query.sessiontoken;

    try {
        const friends = utilAPI.isString(sessionToken)
            ? await getFriends(sessionToken)
            : [];

        const influencers = await userAPI.getInfluencers();

        res.json({
            themeID,
            votes: await voteAPI.getVotes(themeID, friends),
            votesFromInfluencer: await voteAPI.getVotes(themeID, influencers)
        });
    } catch (e) {
        next(createError(400));
    }
});

router.put("/votes/:themeid", async (req, res, next) => {
    const themeID = parseInt(req.params.themeid, 10);
    const sessionToken: unknown = req.query.sessiontoken;
    const answer: unknown = req.query.answer;

    if (!utilAPI.isString(sessionToken) || !utilAPI.isString(answer)) {
        return next(createError(400));
    }

    try {
        await voteAPI.vote(themeID, sessionToken, parseInt(answer, 10));
        res.status(200).send("");
    } catch (e) {
        next(createError(401));
    }
});

router.get("/transitions/:themeid", (req, res, next) => {
    const themeID = parseInt(req.params.themeid, 10);

    const transition = transitions.find(transition => transition.themeID == themeID);
    if (!transition) { return next(createError(404)); }

    res.json(transition);
});

router.get("/comments/:themeid", async (req, res, next) => {
    const themeID = parseInt(req.params.themeid, 10);

    try {
        res.json({
            themeID,
            comments: await commentAPI.getComments(themeID)
        });
    } catch (e) {
        next(createError(404));
    }
});

router.post("/comments/:themeid", async (req, res, next) => {
    const themeID = parseInt(req.params.themeid, 10);
    const sessionToken: unknown = req.query.sessiontoken;
    const message: unknown = req.query.message;

    if (!utilAPI.isString(sessionToken) || !utilAPI.isString(message)) {
        return next(createError(400));
    }

    try {
        await commentAPI.comment(themeID, sessionToken, message);
        res.status(201).send("");
    } catch (e) {
        next(createError(401));
    }
});

export default router;
