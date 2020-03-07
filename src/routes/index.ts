import express from "express";
const router = express.Router();

import themeLoader from "../api/theme";
import * as indexAPI from "../api/index";
import * as utilAPI from "../api/util";
import createError from "http-errors";

/* GET home page. */
router.get("/", (_req, res, _next) => {
    res.render("index", {
        title: "/", docs: [
            {
                uri: "auth",
                description: "Authentication API"
            },
            {
                uri: "vote",
                description: "Voting API"
            },
            {
                uri: "news",
                description: "News API"
            },
            {
                uri: "themes",
                description: "Get theme data",
                req: ["themeid: Theme id"],
                res: ["themeid: Theme id", "title: String", "description: String", "choices: String array"],
                method: "GET",
                query: "/0"
            },
            {
                uri: "profiles",
                description: "Get user profile",
                req: ["sessiontoken: Given session token"],
                res: ["name: String", "imageURI: String", "isInfluencer: Boolean"],
                method: "GET",
                query: "?sessiontoken=test"
            },
            {
                uri: "feedback",
                description: "Send a feedback",
                req: ["message: Feedback string"],
                res: ["message: Feedback string"],
                method: "POST",
                query: "?message=\"test\""
            },
            {
                uri: "application",
                description: "Send a application",
                req: ["message: Application string"],
                res: ["message: Application string"],
                method: "POST",
                query: "?message=\"test\""
            }
        ]
    });
});
router.get("/themes", (_req, res, _next) => {
    res.json(themeLoader.themes.map((theme, themeID) => ({
        themeID: themeID,
        title: theme.title,
        description: theme.description,
        imageURI: theme.imageURI,
        genre: theme.genre,
        choices: theme.choices
    })));
});

router.get("/themes/:themeid", (req, res, next) => {
    const themeID = parseInt(req.params.themeid, 10);

    if (themeLoader.themes[themeID] != undefined) {
        res.json({
            themeID: themeID,
            title: themeLoader.themes[themeID].title,
            description: themeLoader.themes[themeID].description,
            choices: themeLoader.themes[themeID].choices
        });
    } else {
        console.log("The themeID is invalid");
        next(createError(400));
    }
});

router.get("/profiles", async (req, res, next) => {
    const sessionToken: unknown = req.query.sessiontoken;

    if (!utilAPI.isString(sessionToken)) {
        return next(createError(400));
    }

    try {
        res.json(await indexAPI.getProfile(sessionToken));
    } catch (e) {
        console.log(e);
        next(createError(400));
    }
});

router.post("/feedback", async (req, res, next) => {
    const message: unknown = req.query.message;
    if (!utilAPI.isString(message)) {
        return next(createError(400));
    }

    try {
        res.status(201).json({
            message: await indexAPI.saveFeedback(message, "Feedback")
        });
    } catch (e) {
        console.log(e);
        next(createError(500));
    }
});

router.post("/application", async (req, res, next) => {
    const message: unknown = req.query.message;
    if (!utilAPI.isString(message)) {
        return next(createError(400));
    }

    try {
        res.status(201).json({
            message: await indexAPI.saveFeedback(message, "Application")
        });
    } catch (e) {
        console.log(e);
        next(createError(500));
    }
});

router.get("/418", (_req, _res, next) => {
    next(createError(418));
});

export default router;
