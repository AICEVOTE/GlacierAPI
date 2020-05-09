import express from "express";
import createError from "http-errors";
import * as themeAPI from "../api/theme";
import * as utilAPI from "../api/util";
import type { ThemeModel } from "../model";
const router = express.Router();


async function getTheme(theme: ThemeModel) {
    return {
        themeID: theme.themeID,
        userProvider: theme.userProvider,
        userID: theme.userID,
        title: theme.title,
        description: theme.description,
        imageURI: theme.imageURI,
        genre: theme.genre,
        choices: theme.choices,
        keywords: theme.keywords,
        topicality: await themeAPI.calcTopicality(theme.themeID)
    };
}

router.get("/themes", async (_req, res, _next) => {
    const themes = await themeAPI.getAllThemes();
    res.json(await Promise.all(themes
        .map(theme => getTheme(theme))));
});

router.get("/themes/:themeid", async (req, res, next) => {
    const themeID = parseInt(req.params.themeid, 10);

    try {
        const theme = await themeAPI.getTheme(themeID);
        res.json(await getTheme(theme));
    } catch (e) {
        next(createError(404));
    }
});

router.put("/themes/:themeid", async (req, res, next) => {
    const themeID = parseInt(req.params.themeid, 10),
        sessionToken: unknown = req.query.sessiontoken,
        isEnabled: unknown = req.query.isenabled,
        title: unknown = req.query.title,
        description: unknown = req.query.description,
        imageURI: unknown = req.query.imageuri,
        genre: unknown = req.query.genre,
        choices: unknown = req.query.choices,
        DRClass: unknown = req.query.drclass;

    if (!utilAPI.isString(sessionToken)
        || !utilAPI.isString(isEnabled)
        || !utilAPI.isString(title)
        || !utilAPI.isString(description)
        || !utilAPI.isString(imageURI)
        || !utilAPI.isString(genre)
        || !utilAPI.isString(choices)
        || !utilAPI.isString(DRClass)) {
        return next(createError(400));
    }

    try {
        await themeAPI.updateTheme(
            sessionToken,
            isEnabled == "true",
            themeID, title, description, imageURI,
            parseInt(genre, 10),
            choices.split(','),
            parseInt(DRClass, 10)
        );
        res.status(200).send("");
    } catch (e) {
        next(createError(400));
    }
});

export default router;
