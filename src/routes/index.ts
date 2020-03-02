import express from "express";
const router = express.Router();

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

router.post("/feedback", async (req, res, next) => {
    const message: unknown = req.query.message;
    if (!utilAPI.isString(message)) {
        return next(createError(400));
    }

    try {
        res.status(201).json(await utilAPI.saveFeedback(message, "Feedback"));
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
        res.status(201).json(await utilAPI.saveFeedback(message, "Application"));
    } catch (e) {
        console.log(e);
        next(createError(500));
    }
});

router.get("/418", (_req, _res, next) => {
    next(createError(418));
});

export default router;
