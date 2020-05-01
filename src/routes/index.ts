import express from "express";
import createError from "http-errors";
import * as feedbackAPI from "../api/feedback";
import { themeLoader } from "../api/theme";
import type { Theme } from "../api/theme";
import * as utilAPI from "../api/util";
const router = express.Router();


/* GET home page. */
router.get("/", function (_req, res, _next) {
    res.render("index", { title: "Glacier API" });
});

async function getTheme(theme: Theme) {
    return {
        themeID: theme.themeID,
        title: theme.title,
        description: theme.description,
        imageURI: theme.imageURI,
        genre: theme.genre,
        choices: theme.choices,
        topicality: await utilAPI.calcTopicality(theme.themeID)
    };
}

router.get("/themes", async (_req, res, next) => {
    try {
        res.json(await Promise.all(themeLoader.themes
            .map(theme => getTheme(theme))));
    } catch (e) {
        console.log(e);
        next(createError(500));
    }
});

router.get("/themes/:themeid", async (req, res, next) => {
    const themeID = parseInt(req.params.themeid, 10);

    try {
        const theme = themeLoader.theme(themeID);
        res.json(await getTheme(theme));
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
            message: await feedbackAPI.saveFeedback(message, "Feedback")
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
            message: await feedbackAPI.saveFeedback(message, "Application")
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
