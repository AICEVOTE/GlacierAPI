import express from "express";
import createError from "http-errors";
import * as commentAPI from "../api/comment";
import * as userAPI from "../api/user";
import * as utilAPI from "../api/util";
import * as voteAPI from "../api/vote";
import { themeLoader } from "../theme";
import type { Theme } from "../theme";
const router = express.Router();


function getResults(theme: Theme) {
    return {
        themeID: theme.themeID,
        results: theme.realtimeResult,
        counts: theme.realtimeCount
    };
}

router.get("/results", (_req, res, _next) => {
    res.json(themeLoader.themes.map(theme => getResults(theme)));
});

router.get("/results/:themeid", (req, res, next) => {
    const themeID = parseInt(req.params.themeid, 10);

    try {
        const theme = themeLoader.theme(themeID);
        res.json(getResults(theme));
    } catch (e) {
        console.log("The themeID is invalid");
        next(createError(404));
    }
});

async function getVotes(themeID: number,
    friends: { userProvider: string, userID: string }[],
    influencers: { userProvider: string, userID: string }[]) {
    return {
        themeID,
        votes: await voteAPI.getVotes(themeID, friends),
        votesFromInfluencer: await voteAPI.getVotes(themeID, influencers)
    };
}

router.get("/votes", async (req, res, next) => {
    const sessionToken: unknown = req.query.sessiontoken;

    try {
        const friends = utilAPI.isString(sessionToken)
            ? (await userAPI.getMe(sessionToken))
                .friends.map(userID => ({
                    userProvider: "twitter",
                    userID
                }))
            : [];
        const influencers = await userAPI.getInfluencers();
        res.json(await Promise.all(themeLoader.themes
            .map(theme => getVotes(theme.themeID, friends, influencers))));
    } catch (e) {
        console.log(e);
        next(createError(400));
    }
});

router.get("/votes/:themeid", async (req, res, next) => {
    const themeID = parseInt(req.params.themeid, 10);
    const sessionToken: unknown = req.query.sessiontoken;

    try {
        const friends = utilAPI.isString(sessionToken)
            ? (await userAPI.getMe(sessionToken))
                .friends
                .map(userID => ({
                    userProvider: "twitter",
                    userID
                }))
            : [];
        const influencers = await userAPI.getInfluencers();

        res.json(await getVotes(themeID, friends, influencers));
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
        await voteAPI.vote(themeID, sessionToken, parseInt(answer, 10));
        res.status(200).send("");
    } catch (e) {
        console.log(e);
        next(createError(400));
    }
});

function getTransitions(theme: Theme) {
    return {
        themeID: theme.themeID,
        shortTransition: theme.shortTransition,
        longTransition: theme.longTransition
    };
}

router.get("/transitions", (_req, res, _next) => {
    res.json(themeLoader.themes.map(theme => getTransitions(theme)));
});

router.get("/transitions/:themeid", (req, res, next) => {
    const themeID = parseInt(req.params.themeid, 10);

    try {
        const theme = themeLoader.theme(themeID);
        res.json(getTransitions(theme));
    } catch (e) {
        console.log("The themeID is invalid");
        return next(createError(404));
    }
});

async function getComments(themeID: number) {
    return {
        themeID,
        comments: await commentAPI.getComments(themeID)
    };
}

router.get("/comments", async (_req, res, next) => {
    try {
        res.json(await Promise.all(themeLoader.themes
            .map(theme => getComments(theme.themeID))));
    } catch (e) {
        console.log(e);
        next(createError(404));
    }
});

router.get("/comments/:themeid", async (req, res, next) => {
    const themeID = parseInt(req.params.themeid, 10);

    try {
        res.json(await getComments(themeID));
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
        await commentAPI.comment(themeID, sessionToken, message);
        res.status(201).send("");
    } catch (e) {
        console.log(e);
        next(createError(400));
    }
});

export default router;
