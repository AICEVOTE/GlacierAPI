import express from "express";
import createError from "http-errors";
import * as newsAPI from "../api/news";
import * as themeAPI from "../api/theme";
const router = express.Router();


router.get("/articles", (_req, res, _next) => {
    res.json(newsAPI.articles);
});

router.get("/articles/:themeid", async (req, res, next) => {
    const themeID = parseInt(req.params.themeid, 10);

    if ((await themeAPI.exists(themeID)) == false) {
        console.log("Invalid themeID");
        return next(createError(404));
    }
    const articles = newsAPI
        .articles.related
        .find(articles => articles.themeID == themeID)?.articles || []

    res.json({ themeID, articles });
});

export default router;
