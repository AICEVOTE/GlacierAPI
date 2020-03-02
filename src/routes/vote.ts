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
                req: ["id: Theme id"],
                res: ["id: Theme id", "results: Results", "counts: Counts"],
                method: "GET",
                query: "/0"
            },
            {
                uri: "votes",
                description: "Get votes",
                req: ["id: Theme id", "sessiontoken: Given session token"],
                res: ["id: Theme id", "votes: Votes from friends", "votesFromInfluencer: Votes from influencers"],
                method: "GET",
                query: "/0?sessiontoken=test"
            },
            {
                uri: "votes",
                description: "Put vote",
                req: ["id: Theme id", "sessiontoken: Given session token", "answer: answer"],
                res: ["id: Theme id", "votes: Votes from friends", "votesFromInfluencer: Votes from influencers"],
                method: "PUT",
                query: "/0?sessiontoken=test&answer=0"
            },
            {
                uri: "transitions",
                description: "Get transitions",
                req: ["id: Theme id"],
                res: ["id: Theme id", "shortTransition: Short-term transition", "longTransition: Long-term transition"],
                method: "GET",
                query: "/0"
            },
            {
                uri: "comments",
                description: "Get all comments",
                req: ["id: Theme id"],
                res: ["id: Theme id", "comments: All comments"],
                method: "GET",
                query: "/0"
            },
            {
                uri: "comments",
                description: "Get all comments",
                req: ["id: Theme id", "sessiontoken: Given session token", "message: Comment string"],
                res: ["id: Theme id", "comments: All comments"],
                method: "POST",
                query: "/0?sessiontoken=test&message=test"
            }
        ]
    });
});

router.get("/results/:id", (req, res, next) => {
    const id = parseInt(req.params.id, 10);

    if (themeLoader.themes[id] != undefined) {
        res.json({
            id: id,
            results: themeLoader.themes[id].realtimeResult,
            counts: themeLoader.themes[id].realtimeCount
        });
    } else {
        console.log("The id is invalid");
        next(createError(404));
    }
});

router.get("/votes/:id", async (req, res, next) => {
    const id = parseInt(req.params.id, 10);
    const sessionToken: unknown = req.query.sessiontoken;

    try {
        res.json({
            id: id,
            votes: utilAPI.isString(sessionToken) ? await voteAPI.getFriendVotes(id, sessionToken) : [],
            votesFromInfluencer: await voteAPI.getInfluencerVotes(id)
        });
    } catch (e) {
        console.log(e);
        next(createError(400));
    }
});

router.put("/votes/:id", async (req, res, next) => {
    const id = parseInt(req.params.id, 10);
    const sessionToken: unknown = req.query.sessiontoken;
    const answer: unknown = req.query.answer;

    if (!utilAPI.isString(sessionToken) || !utilAPI.isString(answer)) {
        return next(createError(400));
    }

    try {
        await voteAPI.putVote(id, sessionToken, parseInt(answer, 10));
        res.json({
            id: id,
            votes: await voteAPI.getFriendVotes(id, sessionToken),
            votesFromInfluencer: await voteAPI.getInfluencerVotes(id)
        });
    } catch (e) {
        console.log(e);
        next(createError(400));
    }
});

router.get("/transitions/:id", (req, res, next) => {
    const id = parseInt(req.params.id, 10);

    if (themeLoader.themes[id] != undefined) {
        res.json({
            id: id,
            shortTransition: themeLoader.themes[id].shortTransition,
            longTransition: themeLoader.themes[id].longTransition
        });
    } else {
        console.log("The id is invalid");
        next(createError(404));
    }
});

router.get("/comments/:id", async (req, res, next) => {
    const id = parseInt(req.params.id, 10);

    try {
        res.json({
            id: id,
            comments: await voteAPI.getComments(id)
        });
    } catch (e) {
        console.log(e);
        next(createError(404));
    }
});

router.post("/comments/:id", async (req, res, next) => {
    const id = parseInt(req.params.id, 10);
    const sessionToken: unknown = req.query.sessiontoken;
    const message: unknown = req.query.message;

    if (!utilAPI.isString(sessionToken) || !utilAPI.isString(message)) {
        return next(createError(400));
    }

    try {
        await voteAPI.postComment(id, sessionToken, message);
        res.status(201).json({
            id: id,
            comments: await voteAPI.getComments(id)
        });
    } catch (e) {
        console.log(e);
        next(createError(400));
    }
});

export default router;
