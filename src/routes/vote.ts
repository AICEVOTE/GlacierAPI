import express from "express";
const router = express.Router();

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
                req: ["id: Theme id", "sessionid: Given session ID"],
                res: ["id: Theme id", "votes: Votes from friends", "votesFromInfluencer: Votes from influencers"],
                method: "GET",
                query: "/0?sessionid=test"
            },
            {
                uri: "votes",
                description: "Put vote",
                req: ["id: Theme id", "sessionid: Given session ID", "answer: answer"],
                res: ["id: Theme id", "votes: Votes from friends", "votesFromInfluencer: Votes from influencers"],
                method: "PUT",
                query: "/0?sessionid=test&answer=0"
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
                req: ["id: Theme id", "sessionid: Given session ID", "message: Comment string"],
                res: ["id: Theme id", "comments: All comments"],
                method: "POST",
                query: "/0?sessionid=test&message=test"
            }
        ]
    });
});

router.get("/results/:id", (req, res, next) => {
    const id = parseInt(req.params.id, 10);

    try {
        res.json({
            id: id,
            results: voteAPI.getResult(id),
            counts: voteAPI.getCount(id),
        });
    } catch (e) {
        console.log(e);
        next(createError(404));
    }
});

router.get("/votes/:id", async (req, res, next) => {
    const id = parseInt(req.params.id, 10);
    const sessionID: unknown = req.session?.passport?.user || req.query.sessionid;

    try {
        res.json({
            id: id,
            votes: utilAPI.isString(sessionID) ? await voteAPI.getFriendVotes(id, sessionID) : [],
            votesFromInfluencer: await voteAPI.getInfluencerVotes(id)
        });
    } catch (e) {
        console.log(e);
        next(createError(400));
    }
});

router.put("/votes/:id", async (req, res, next) => {
    const id = parseInt(req.params.id, 10);
    const sessionID: unknown = req.session?.passport?.user || req.query.sessionid;
    const answer: unknown = req.query.answer;

    if (!utilAPI.isString(sessionID) || !utilAPI.isString(answer)) {
        return next(createError(400));
    }

    try {
        await voteAPI.putVote(id, sessionID, parseInt(answer, 10));
        res.json({
            id: id,
            votes: await voteAPI.getFriendVotes(id, sessionID),
            votesFromInfluencer: await voteAPI.getInfluencerVotes(id)
        });
    } catch (e) {
        console.log(e);
        next(createError(400));
    }
});

router.get("/transitions/:id", (req, res, next) => {
    const id = parseInt(req.params.id, 10);

    try {
        res.json({
            id: id,
            shortTransition: voteAPI.getShortTransition(id),
            longTransition: voteAPI.getLongTransition(id)
        });
    } catch (e) {
        console.log(e);
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
    const sessionID: unknown = req.session?.passport?.user || req.query.sessionid;
    const message: unknown = req.query.message;

    if (!utilAPI.isString(sessionID) || !utilAPI.isString(message)) {
        return next(createError(400));
    }

    try {
        await voteAPI.postComment(id, sessionID, message);
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
