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
        isPersonalMatters: theme.isPersonalMatters,
        topicality: await themeAPI.calcTopicality(theme.themeID)
    };
}

router.get("/themes", async (req, res, _next) => {
    const q = req.query.q;

    const themes = utilAPI.isString(q)
        ? await themeAPI.getThemesByRegex(q)
        : await themeAPI.getAllThemes();
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
    const query = req.body;
    const themeID = parseInt(req.params.themeid, 10),
        sessionToken: unknown = query.sessionToken,
        isEnabled: unknown = query.isEnabled,
        title: unknown = query.title,
        description: unknown = query.description,
        imageURI: unknown = query.imageURI,
        genre: unknown = query.genre,
        choices: unknown = query.choices,
        DRClass: unknown = query.DRClass,
        isPersonalMatters: unknown = query.isPersonalMatters;

    if (!utilAPI.isString(sessionToken)
        || !utilAPI.isBoolean(isEnabled)
        || !utilAPI.isString(title)
        || !utilAPI.isString(description)
        || !utilAPI.isString(imageURI)
        || !utilAPI.isNumber(genre)
        || !utilAPI.isArray(choices)
        || !utilAPI.isNumber(DRClass)
        || !utilAPI.isBoolean(isPersonalMatters)) {
        return next(createError(400));
    }

    try {
        await themeAPI.updateTheme(
            sessionToken, isEnabled,
            themeID, title, description, imageURI,
            genre, choices, DRClass, isPersonalMatters
        );
        res.status(200).send("");
    } catch (e) {
        next(createError(400));
    }
});

export default router;
