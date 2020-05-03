import express from "express";
import createError from "http-errors";
import * as themeAPI from "../api/theme";
import type { ThemeModel } from "../model";
const router = express.Router();


async function getTheme(theme: ThemeModel) {
    return {
        ...theme,
        topicality: await themeAPI.calcTopicality(theme.themeID)
    };
}

router.get("/themes", async (_req, res, next) => {
    try {
        const themes = await themeAPI.getAllThemes();
        res.json(await Promise.all(themes
            .map(theme => getTheme(theme))));
    } catch (e) {
        console.log(e);
        next(createError(500));
    }
});

router.get("/themes/:themeid", async (req, res, next) => {
    const themeID = parseInt(req.params.themeid, 10);

    try {
        const theme = await themeAPI.getTheme(themeID);
        res.json(await getTheme(theme));
    } catch (e) {
        console.log(e);
        next(createError(400));
    }
});

export default router;
