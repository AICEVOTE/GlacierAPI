import express from "express";
const router = express.Router();

import themeLoader from "../api/theme";
import * as voteAPI from "../api/vote";
import * as utilAPI from "../api/util";
import createError from "http-errors";

router.get("/results", (_req, res, _next) => {
    res.json(themeLoader.themes.map((theme, themeID) => ({
        themeID: themeID,
        results: theme.realtimeResult,
        counts: theme.realtimeCount
    })));
});

router.get("/results/:themeid", (req, res, next) => {
    const themeID = parseInt(req.params.themeid, 10);

    if (themeLoader.themes[themeID] != undefined) {
        res.json({
            themeID: themeID,
            results: themeLoader.themes[themeID].realtimeResult,
            counts: themeLoader.themes[themeID].realtimeCount
        });
    } else {
        console.log("The themeID is invalid");
        next(createError(404));
    }
});

router.get("/votes", async (req, res, next) => {
    const sessionToken: unknown = req.query.sessiontoken;

    try {
        res.json(await Promise.all(themeLoader.themes.map(async (_theme, themeID) => {
            let votes: {
                themeID: number;
                answer: number;
                userProvider: string;
                userID: string;
                createdAt: number;
            }[] = [];
            if (utilAPI.isString(sessionToken)) {
                votes = await voteAPI.getFriendVotes(themeID, sessionToken);
            }

            return {
                themeID: themeID,
                votes: votes,
                votesFromInfluencer: await voteAPI.getInfluencerVotes(themeID)
            };
        })));
    } catch (e) {
        console.log(e);
        next(createError(400));
    }
});

router.get("/votes/:themeid", async (req, res, next) => {
    const themeID = parseInt(req.params.themeid, 10);
    const sessionToken: unknown = req.query.sessiontoken;

    try {
        let votes: {
            themeID: number;
            answer: number;
            userProvider: string;
            userID: string;
            createdAt: number;
        }[] = [];
        if (utilAPI.isString(sessionToken)) {
            votes = await voteAPI.getFriendVotes(themeID, sessionToken);
        }

        res.json({
            themeID: themeID,
            votes: votes,
            votesFromInfluencer: await voteAPI.getInfluencerVotes(themeID)
        });
    } catch (e) {
        console.log(e);
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
        await voteAPI.putVote(themeID, sessionToken, parseInt(answer, 10));
        res.json({
            themeID: themeID,
            votes: await voteAPI.getFriendVotes(themeID, sessionToken),
            votesFromInfluencer: await voteAPI.getInfluencerVotes(themeID)
        });
    } catch (e) {
        console.log(e);
        next(createError(400));
    }
});

router.get("/transitions", (_req, res, _next) => {
    res.json(themeLoader.themes.map((theme, themeID) => ({
        themeID: themeID,
        shortTransition: theme.shortTransition,
        longTransition: theme.longTransition
    })));
});

router.get("/transitions/:themeid", (req, res, next) => {
    const themeID = parseInt(req.params.themeid, 10);

    if (themeLoader.themes[themeID] == undefined) {
        console.log("The themeID is invalid");
        return next(createError(404));
    }

    res.json({
        themeID: themeID,
        shortTransition: themeLoader.themes[themeID].shortTransition,
        longTransition: themeLoader.themes[themeID].longTransition
    });
});

router.get("/comments", async (_req, res, next) => {
    try {
        res.json(await Promise.all(themeLoader.themes.map(async (_theme, themeID) => ({
            themeID: themeID,
            comments: await voteAPI.getComments(themeID)
        }))));
    } catch (e) {
        console.log(e);
        next(createError(404));
    }
});

router.get("/comments/:themeid", async (req, res, next) => {
    const themeID = parseInt(req.params.themeid, 10);

    try {
        res.json({
            themeID: themeID,
            comments: await voteAPI.getComments(themeID)
        });
    } catch (e) {
        console.log(e);
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
        await voteAPI.postComment(themeID, sessionToken, message);
        res.status(201).json({
            themeID: themeID,
            comments: await voteAPI.getComments(themeID)
        });
    } catch (e) {
        console.log(e);
        next(createError(400));
    }
});

export default router;
