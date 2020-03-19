import express from "express";
const router = express.Router();

import themeLoader from "../api/theme";
import * as indexAPI from "../api/index";
import * as utilAPI from "../api/util";
import createError from "http-errors";

/* GET home page. */
router.get("/", function (_req, res, _next) {
    res.render("index", { title: "Glacier API" });
});

router.get("/themes", async (_req, res, _next) => {
    res.json(await Promise.all(themeLoader.themes.map(async (theme, themeID) => ({
        themeID: themeID,
        title: theme.title,
        description: theme.description,
        imageURI: theme.imageURI,
        genre: theme.genre,
        choices: theme.choices,
        topicality: await indexAPI.getTopicality(themeID)
    }))));
});

router.get("/themes/:themeid", async (req, res, next) => {
    const themeID = parseInt(req.params.themeid, 10);

    if (themeLoader.themes[themeID] != undefined) {
        res.json({
            themeID: themeID,
            title: themeLoader.themes[themeID].title,
            description: themeLoader.themes[themeID].description,
            imageURI: themeLoader.themes[themeID].imageURI,
            genre: themeLoader.themes[themeID].genre,
            choices: themeLoader.themes[themeID].choices,
            topicality: await indexAPI.getTopicality(themeID)
        });
    } else {
        console.log("The themeID is invalid");
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
