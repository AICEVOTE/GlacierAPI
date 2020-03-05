import express from "express";
const router = express.Router();

import themeLoader from "../api/theme";
import * as voteAPI from "../api/vote";
import * as utilAPI from "../api/util";
import createError from "http-errors";

router.get("/", (_req, res, _next) => {
    res.render("index", {
        title: "/vote/", docs: [
            {
                uri: "results",
                description: "Get latest result",
                req: ["themeid: Theme id"],
                res: ["themeid: Theme id", "results: Results", "counts: Counts"],
                method: "GET",
                query: "/0"
            },
            {
                uri: "votes",
                description: "Get votes",
                req: ["themeid: Theme id", "sessiontoken: Given session token"],
                res: ["themeid: Theme id", "votes: Votes from friends", "votesFromInfluencer: Votes from influencers"],
                method: "GET",
                query: "/0?sessiontoken=test"
            },
            {
                uri: "votes",
                description: "Put vote",
                req: ["themeid: Theme id", "sessiontoken: Given session token", "answer: answer"],
                res: ["themeid: Theme id", "votes: Votes from friends", "votesFromInfluencer: Votes from influencers"],
                method: "PUT",
                query: "/0?sessiontoken=test&answer=0"
            },
            {
                uri: "transitions",
                description: "Get transitions",
                req: ["themeid: Theme id"],
                res: ["themeid: Theme id", "shortTransition: Short-term transition", "longTransition: Long-term transition"],
                method: "GET",
                query: "/0"
            },
            {
                uri: "comments",
                description: "Get all comments",
                req: ["themeid: Theme id"],
                res: ["themeid: Theme id", "comments: All comments"],
                method: "GET",
                query: "/0"
            },
            {
                uri: "comments",
                description: "Get all comments",
                req: ["themeid: Theme id", "sessiontoken: Given session token", "message: Comment string"],
                res: ["themeid: Theme id", "comments: All comments"],
                method: "POST",
                query: "/0?sessiontoken=test&message=test"
            }
        ]
    });
});

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
        res.json(await Promise.all(themeLoader.themes.map(async (_theme, themeID) => ({
            themeID: themeID,
            votes: utilAPI.isString(sessionToken) ? await voteAPI.getFriendVotes(themeID, sessionToken) : [],
            votesFromInfluencer: await voteAPI.getInfluencerVotes(themeID)
        }))));
    } catch (e) {
        console.log(e);
        next(createError(400));
    }
});

router.get("/votes/:themeid", async (req, res, next) => {
    const themeID = parseInt(req.params.themeid, 10);
    const sessionToken: unknown = req.query.sessiontoken;

    try {
        res.json({
            themeID: themeID,
            votes: utilAPI.isString(sessionToken) ? await voteAPI.getFriendVotes(themeID, sessionToken) : [],
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

    if (themeLoader.themes[themeID] != undefined) {
        res.json({
            themeID: themeID,
            shortTransition: themeLoader.themes[themeID].shortTransition,
            longTransition: themeLoader.themes[themeID].longTransition
        });
    } else {
        console.log("The themeID is invalid");
        next(createError(404));
    }
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
