import express from "express";
import createError from "http-errors";
import * as themeAPI from "../api/theme";
import type { ThemeModel } from "../model";
const router = express.Router();


async function getTheme(theme: ThemeModel) {
    return {
        themeID: theme.themeID,
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

export default router;
