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
                req: ["id: Theme id"],
                res: ["id: Theme id", "title: String", "description: String", "choices: String array"],
                method: "GET",
                query: "/0"
            },
            {
                uri: "profiles",
                description: "Get user profile",
                req: ["sessionid: Given session ID"],
                res: ["name: String", "imageURI: String", "isInfluencer: Boolean"],
                method: "GET",
                query: "?sessionid=test"
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

router.get("/themes/:id", (req, res, next) => {
    const id = parseInt(req.params.id, 10);

    if (themeLoader.themes[id] != undefined) {
        res.json({
            id: id,
            title: themeLoader.themes[id].title,
            description: themeLoader.themes[id].description,
            choices: themeLoader.themes[id].choices
        });
    } else {
        console.log("The id is invalid");
        next(createError(400));
    }
});

router.get("/profiles", async (req, res, next) => {
    const sessionID: unknown = req.session?.passport?.user || req.query.sessionid;

    if (!utilAPI.isString(sessionID)) {
        return next(createError(400));
    }

    try {
        res.json(await indexAPI.getProfile(sessionID));
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
